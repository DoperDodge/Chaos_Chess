import { getRuleById } from '@chaotic-chess/shared/rules';

export function registerSocketHandlers(io, registry) {
  io.on('connection', (socket) => {
    console.log(`[socket] connect ${socket.id}`);

    socket.on('lobby:create', ({ name, settings = {} }, ack) => {
      const lobby = registry.create(socket.id, name || 'Host', settings);
      socket.join(lobby.code);
      ack?.({ ok: true, lobby: lobby.detail() });
      io.emit('lobby:list-updated');
    });

    socket.on('lobby:join', ({ code, name }, ack) => {
      const lobby = registry.get(code);
      if (!lobby) return ack?.({ ok: false, error: 'lobby not found' });
      if (lobby.gameStarted) return ack?.({ ok: false, error: 'game in progress' });
      const result = lobby.join(socket.id, name || 'Guest');
      if (!result.ok) return ack?.(result);
      socket.join(lobby.code);
      ack?.({ ok: true, lobby: lobby.detail() });
      io.to(lobby.code).emit('lobby:updated', lobby.detail());
      io.emit('lobby:list-updated');
    });

    socket.on('lobby:leave', (_payload, ack) => {
      const lobby = registry.findBySocket(socket.id);
      if (!lobby) return ack?.({ ok: false });
      const role = lobby.removeSocket(socket.id);
      socket.leave(lobby.code);
      if (role === 'host-left' || (!lobby.host && !lobby.guest)) {
        registry.remove(lobby.code);
        io.to(lobby.code).emit('lobby:closed');
      } else {
        io.to(lobby.code).emit('lobby:updated', lobby.detail());
      }
      io.emit('lobby:list-updated');
      ack?.({ ok: true });
    });

    socket.on('lobby:set-banlist', ({ banlist }, ack) => {
      const lobby = registry.findBySocket(socket.id);
      if (!lobby) return ack?.({ ok: false });
      lobby.setBanlist(socket.id, banlist);
      io.to(lobby.code).emit('lobby:updated', lobby.detail());
      ack?.({ ok: true });
    });

    socket.on('lobby:ready', ({ ready }, ack) => {
      const lobby = registry.findBySocket(socket.id);
      if (!lobby) return ack?.({ ok: false });
      lobby.setReady(socket.id, ready);
      io.to(lobby.code).emit('lobby:updated', lobby.detail());
      if (lobby.bothReady()) {
        const start = lobby.startGame();
        if (start.ok) {
          io.to(lobby.code).emit('game:start', {
            state: start.game.publicState(),
            colors: {
              [lobby.host.socketId]: lobby.host.color,
              [lobby.guest.socketId]: lobby.guest.color,
            },
          });
          maybeRequestPick(io, lobby);
        }
      }
      ack?.({ ok: true });
    });

    socket.on('game:move', ({ from, to, promotion }, ack) => {
      const lobby = registry.findBySocket(socket.id);
      if (!lobby?.game) return ack?.({ ok: false, error: 'no game' });
      const game = lobby.game;

      // Handle skip-turn and extra-turn flow
      if (game.skipNextTurnFor === game.currentTurnColor()) {
        // The current side is supposed to be skipped; we just advance the chess turn (null move) by FEN swap
        skipCurrentSide(game);
        game.skipNextTurnFor = null;
        io.to(lobby.code).emit('game:state', { state: game.publicState(), events: [{ type: 'turn-skipped' }] });
      }

      const result = game.attemptMove(socket.id, { from, to, promotion });
      if (!result.ok) return ack?.({ ok: false, error: result.error });
      ack?.({ ok: true });
      // Handle extra turn from rules
      const events = result.events || [];
      const justMoved = result.move.color === 'w' ? 'white' : 'black';
      if (game.extraTurnFor === justMoved) {
        flipTurn(game);
        events.push({ type: 'extra-turn-active', color: justMoved });
        game.extraTurnFor = null;
      }
      io.to(lobby.code).emit('game:state', { state: game.publicState(), events });
      maybeRequestPick(io, lobby);
    });

    socket.on('game:pick-rule', ({ ruleId }, ack) => {
      const lobby = registry.findBySocket(socket.id);
      if (!lobby?.game) return ack?.({ ok: false, error: 'no game' });
      const game = lobby.game;
      if (!game.pendingPick) return ack?.({ ok: false, error: 'no pick pending' });
      const picker = game.pendingPick.picker;
      if (game.colorOf(socket.id) !== picker) return ack?.({ ok: false, error: 'not your pick' });
      if (!game.pendingPick.offerings.includes(ruleId)) return ack?.({ ok: false, error: 'rule not offered' });

      const result = game.engine.activate(ruleId, picker);
      game.pendingPick = null;
      ack?.({ ok: true });
      const events = result?.events || [];
      io.to(lobby.code).emit('game:state', { state: game.publicState(), events });
    });

    socket.on('game:resign', (_payload, ack) => {
      const lobby = registry.findBySocket(socket.id);
      if (!lobby?.game) return ack?.({ ok: false });
      const game = lobby.game;
      const color = game.colorOf(socket.id);
      if (!color) return ack?.({ ok: false });
      game.gameOver = { reason: 'resignation', winner: color === 'white' ? 'black' : 'white' };
      io.to(lobby.code).emit('game:state', { state: game.publicState(), events: [{ type: 'game-over', ...game.gameOver }] });
      ack?.({ ok: true });
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnect ${socket.id}`);
      const lobby = registry.findBySocket(socket.id);
      if (!lobby) return;
      const role = lobby.removeSocket(socket.id);
      if (role === 'host-left' || (!lobby.host && !lobby.guest)) {
        registry.remove(lobby.code);
        io.to(lobby.code).emit('lobby:closed');
      } else {
        io.to(lobby.code).emit('lobby:updated', lobby.detail());
        if (lobby.game) {
          // Mark forfeit if game in progress
          const remaining = lobby.host?.socketId || lobby.guest?.socketId;
          if (remaining) {
            const winnerColor = lobby.game.colorOf(remaining);
            lobby.game.gameOver = { reason: 'opponent-disconnect', winner: winnerColor };
            io.to(lobby.code).emit('game:state', {
              state: lobby.game.publicState(),
              events: [{ type: 'game-over', ...lobby.game.gameOver }],
            });
          }
        }
      }
      io.emit('lobby:list-updated');
    });
  });
}

function maybeRequestPick(io, lobby) {
  const game = lobby.game;
  if (!game || game.gameOver || game.pendingPick) return;
  // Check the latest event was rule-pick-required, otherwise nothing to do.
  // We re-check by looking at picker for previous turn boundary
  const lastTurn = game.turnNumber - 1;
  const picker = game.pickerForTurn(lastTurn);
  if (!picker) return;
  // Only request if no rule has been activated for this turn boundary yet
  const offerings = game.engine.generateOfferings(game.settings.rulesPerPick || 3);
  if (!offerings.length) return;
  game.pendingPick = { picker, offerings, expiresAt: Date.now() + 30000 };
  const detailedOfferings = offerings.map(id => {
    const r = getRuleById(id);
    return { id, name: r.name, category: r.category, duration: r.duration, flavor: r.flavor, desc: r.desc };
  });
  io.to(lobby.code).emit('game:rule-pick', { picker, offerings: detailedOfferings });
}

function skipCurrentSide(game) {
  // Flip the side-to-move in the FEN
  const fen = game.chess.fen();
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  // Reset en-passant target
  parts[3] = '-';
  game.chess.load(parts.join(' '));
}

function flipTurn(game) {
  // Force the side that just moved to move again
  const fen = game.chess.fen();
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[3] = '-';
  game.chess.load(parts.join(' '));
}
