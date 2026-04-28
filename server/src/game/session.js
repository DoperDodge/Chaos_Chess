import { Chess } from 'chess.js';
import { RuleEngine } from './rule-engine.js';

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

  // Apply a player's move intent. Returns { ok, error, events }
  attemptMove(socketId, { from, to, promotion }) {
    if (this.gameOver) return { ok: false, error: 'game over' };
    if (this.pendingPick) return { ok: false, error: 'rule pick pending' };
    const color = this.colorOf(socketId);
    if (!color) return { ok: false, error: 'spectator cannot move' };
    if (color !== this.currentTurnColor()) return { ok: false, error: 'not your turn' };

    // Allow rule engine to intercept / modify
    const intercept = this.engine.runHook('onMoveAttempt', { from, to, color });
    const blocking = intercept.find(e => e.type === 'move-blocked');
    if (blocking) return { ok: false, error: blocking.reason || 'move blocked', events: intercept };

    let moveResult;
    try {
      moveResult = this.chess.move({ from, to, promotion: promotion || 'q' });
    } catch (_) {
      moveResult = null;
    }
    if (!moveResult) return { ok: false, error: 'illegal move' };

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
    };
  }
}
