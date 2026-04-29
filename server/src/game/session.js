import { Chess } from 'chess.js';
import { RuleEngine } from './rule-engine.js';
import { ruleImplementations } from '../rules/index.js';

// Wrapper around chess.js that also tracks chaos state, rule activations, and broadcasts state deltas.
export class GameSession {
  constructor({ whiteSocketId, blackSocketId, whiteName, blackName, settings, banlist }) {
    this.chess = new Chess();
    this.whiteSocketId = whiteSocketId;
    this.blackSocketId = blackSocketId;
    this.whiteName = whiteName;
    this.blackName = blackName;
    this.settings = settings;
    this.banlist = new Set(banlist || []);
    this.turnNumber = 1;          // increments after BOTH white and black have moved (a "full turn")
    this.halfMoves = 0;           // number of plies played
    this.activeRules = [];        // see rule-engine.js
    this.history = [];            // [{type, ...}]
    this.pendingPick = null;      // { picker: 'white'|'black', offerings: [ruleId, ...], expiresAt }
    this.engine = new RuleEngine(this);
    this.gameOver = null;         // { reason, winner }
    this.extraTurnFor = null;     // 'white'|'black' if a rule grants an extra turn
    this.skipNextTurnFor = null;  // 'white'|'black' if a rule skips next turn
    this.deadPieces = [];         // pieces removed by chaos rules (kept off-board)
    this.tileEffects = {};        // square -> [effect descriptors]
    this.pieceEffects = {};       // pieceId -> [effect descriptors] (synthetic ids: square notation at time of effect)
    this.bannedPickReason = null;
  }

  colorOf(socketId) {
    if (socketId === this.whiteSocketId) return 'white';
    if (socketId === this.blackSocketId) return 'black';
    return null;
  }

  socketIdFor(color) {
    return color === 'white' ? this.whiteSocketId : this.blackSocketId;
  }

  currentTurnColor() {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  pickerForTurn(turnNumber) {
    // Player 1 (white) picks at turn N, Player 2 at 2N, alternating.
    const interval = this.settings.ruleSelectionInterval;
    if (turnNumber === 0 || turnNumber % interval !== 0) return null;
    const pickIndex = turnNumber / interval; // 1, 2, 3, ...
    return pickIndex % 2 === 1 ? 'white' : 'black';
  }

  // Called once per turn after the move has been applied.
  // Returns deltas for the engine to broadcast.
  afterMove(moveResult) {
    this.halfMoves += 1;
    const events = [];

    // run onMoveEnd hooks
    events.push(...this.engine.runHook('onMoveEnd', { move: moveResult }));

    // chess.js result detection
    if (this.chess.isCheckmate()) {
      this.gameOver = { reason: 'checkmate', winner: this.currentTurnColor() === 'white' ? 'black' : 'white' };
      events.push({ type: 'game-over', ...this.gameOver });
    } else if (this.chess.isStalemate()) {
      this.gameOver = { reason: 'stalemate', winner: null };
      events.push({ type: 'game-over', ...this.gameOver });
    } else if (this.chess.isDraw()) {
      this.gameOver = { reason: 'draw', winner: null };
      events.push({ type: 'game-over', ...this.gameOver });
    }

    // Increment full turn after a black move (a "turn" = both sides have played one ply)
    const justPlayed = moveResult.color === 'w' ? 'white' : 'black';
    if (justPlayed === 'black') {
      const completedTurn = this.turnNumber;
      // run onTurnEnd hooks
      events.push(...this.engine.runHook('onTurnEnd', { turnNumber: completedTurn }));
      // tick durations
      events.push(...this.engine.tickDurations(completedTurn));
      this.turnNumber += 1;
      // Did this completed turn require a rule pick?
      const picker = this.pickerForTurn(completedTurn);
      if (picker && !this.gameOver) {
        events.push({ type: 'rule-pick-required', picker, turnNumber: completedTurn });
      }
    }

    return events;
  }

  // Returns the legal move targets for a piece given chess.js + active rules.
  //   [{ to, native: bool, captured?, flags?, piece? }, ...]
  // native=true means chess.js will validate / apply the move; native=false
  // means a chaos rule extended the move set (Berserker Pawn, Knight Errant,
  // Backwards Pawns, etc.) and the server must apply it manually.
  legalMovesFrom(fromSq) {
    const piece = this.chess.get(fromSq);
    if (!piece) return [];
    let baseMoves = [];
    try { baseMoves = this.chess.moves({ square: fromSq, verbose: true }) || []; } catch (_) {}
    let candidates = baseMoves.map(m => ({
      to: m.to,
      native: true,
      captured: m.captured,
      flags: m.flags,
      piece: m.piece,
      promotion: m.promotion,
    }));
    // Restrict pass — rules narrow the set first.
    for (const inst of this.activeRules) {
      const impl = ruleImplementations[inst.ruleId];
      if (impl?.restrictMoves) {
        try {
          const next = impl.restrictMoves(this, inst, fromSq, candidates);
          if (Array.isArray(next)) candidates = next;
        } catch (_) {}
      }
    }
    // Extra pass — rules add new destinations.
    for (const inst of this.activeRules) {
      const impl = ruleImplementations[inst.ruleId];
      if (impl?.extraMoves) {
        try {
          const extras = impl.extraMoves(this, inst, fromSq) || [];
          for (const e of extras) {
            if (!candidates.some(c => c.to === e.to)) {
              candidates.push({ to: e.to, native: false, captured: e.captured, piece: e.piece || piece.type });
            }
          }
        } catch (_) {}
      }
    }
    return candidates;
  }

  // Returns a map of { fromSq: [legalMove, ...] } for the side to move only.
  // Used to drive the client's possible-move dots/rings.
  legalMovesForSide(color) {
    const cc = color === 'white' ? 'w' : 'b';
    const out = {};
    const FILES = ['a','b','c','d','e','f','g','h'];
    const RANKS = ['1','2','3','4','5','6','7','8'];
    for (const f of FILES) for (const r of RANKS) {
      const sq = `${f}${r}`;
      const p = this.chess.get(sq);
      if (!p || p.color !== cc) continue;
      const m = this.legalMovesFrom(sq);
      if (m.length) out[sq] = m;
    }
    return out;
  }

  // Apply a player's move intent. Returns { ok, error, events }
  attemptMove(socketId, { from, to, promotion }) {
    if (this.gameOver) return { ok: false, error: 'game over' };
    if (this.pendingPick) return { ok: false, error: 'rule pick pending' };
    const color = this.colorOf(socketId);
    if (!color) return { ok: false, error: 'spectator cannot move' };
    if (color !== this.currentTurnColor()) return { ok: false, error: 'not your turn' };

    // Allow rule engine to intercept / block.
    const intercept = this.engine.runHook('onMoveAttempt', { from, to, color });
    const blocking = intercept.find(e => e.type === 'move-blocked');
    if (blocking) return { ok: false, error: blocking.reason || 'move blocked', events: intercept };

    // Some rules apply the move themselves (Backwards Pawns, Confusion).
    // They emit move-applied-manually so we skip standard validation.
    const manual = intercept.find(e => e.type === 'move-applied-manually');
    let moveResult;
    if (manual) {
      moveResult = {
        from: manual.from,
        to: manual.to,
        color: color === 'white' ? 'w' : 'b',
        flags: 'm',
        piece: manual.piece || 'p',
        san: `${manual.from}-${manual.to}`,
      };
    } else {
      // Validate against the rule-aware legal-move set.
      const legal = this.legalMovesFrom(from);
      const match = legal.find(m => m.to === to);
      if (!match) return { ok: false, error: 'illegal move' };
      if (match.native) {
        try {
          moveResult = this.chess.move({ from, to, promotion: promotion || 'q' });
        } catch (_) { moveResult = null; }
        if (!moveResult) return { ok: false, error: 'illegal move' };
      } else {
        // Chaos-extended move: apply manually. Capture whatever's at `to`,
        // place the piece, flip side-to-move.
        const piece = this.chess.get(from);
        if (!piece) return { ok: false, error: 'illegal move' };
        const captured = this.chess.get(to);
        if (typeof this.chess.remove === 'function') {
          if (captured) this.chess.remove(to);
          this.chess.remove(from);
        }
        if (typeof this.chess.put === 'function') {
          this.chess.put(piece, to);
        }
        // Flip side-to-move via FEN edit.
        const fen = this.chess.fen().split(' ');
        fen[1] = fen[1] === 'w' ? 'b' : 'w';
        fen[3] = '-';
        try { this.chess.load(fen.join(' ')); } catch (_) {}
        if (captured) {
          this.deadPieces.push({ square: to, type: captured.type, color: captured.color, killedAtTurn: this.turnNumber });
        }
        moveResult = {
          from,
          to,
          color: piece.color,
          flags: 'cm',
          piece: piece.type,
          captured: captured?.type,
          san: `${from}-${to}`,
        };
      }
    }

    const post = this.afterMove(moveResult);
    return { ok: true, move: moveResult, events: [...intercept, ...post] };
  }

  publicState() {
    return {
      fen: this.chess.fen(),
      turnNumber: this.turnNumber,
      halfMoves: this.halfMoves,
      currentColor: this.currentTurnColor(),
      activeRules: this.activeRules.map(r => ({
        instanceId: r.instanceId,
        ruleId: r.ruleId,
        owner: r.owner,
        turnsRemaining: r.turnsRemaining,
        activatedAt: r.activatedAt,
        meta: r.meta || {},
      })),
      tileEffects: this.tileEffects,
      pieceEffects: this.pieceEffects,
      pendingPick: this.pendingPick,
      gameOver: this.gameOver,
      whiteName: this.whiteName,
      blackName: this.blackName,
      deadPieces: this.deadPieces,
      lastMove: this.chess.history({ verbose: true }).slice(-1)[0] || null,
      ruleInterval: this.settings.ruleSelectionInterval,
      banlist: [...this.banlist],
      // Pre-computed for the side to move so the client can render legal
      // move dots/rings that already account for active chaos rules.
      legalMoves: this.gameOver ? {} : this.legalMovesForSide(this.currentTurnColor()),
    };
  }
}
