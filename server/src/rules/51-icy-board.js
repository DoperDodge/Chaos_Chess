import { addPieceEffect, killPiece, removePieceEffectsByInstance, ownPieceSquares, pickRandom } from './_helpers.js';

// Icy Board: every move resolves a 4-way roll. We approximate by, on each
// completed move, occasionally freezing the moved piece for the next turn or
// killing a random non-king piece (frostbite tally).
export default {
  onActivate(session, instance) {
    instance.meta.frozen = {}; // sq -> turns remaining
    return [{ type: 'icy-board', instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (instance.meta.frozen?.[ctx.from]) {
      return [{ type: 'move-blocked', reason: 'piece is frozen by ice' }];
    }
    return [];
  },
  onMoveEnd(session, instance, ctx) {
    if (!ctx.move) return [];
    const roll = Math.random();
    const events = [];
    if (roll < 0.25) {
      // Freeze the moved piece for next turn
      instance.meta.frozen[ctx.move.to] = 2;
      addPieceEffect(session, ctx.move.to, { type: 'frozen', instanceId: instance.instanceId });
      events.push({ type: 'piece-frozen', square: ctx.move.to, instanceId: instance.instanceId });
    } else if (roll < 0.5) {
      // Frostbite: random non-king piece dies
      const all = [...ownPieceSquares(session, 'white'), ...ownPieceSquares(session, 'black')]
        .filter(p => p.type !== 'k');
      const victim = pickRandom(all);
      if (victim) {
        killPiece(session, victim.square);
        events.push({ type: 'piece-killed', square: victim.square });
      }
    }
    return events;
  },
  onTurnEnd(session, instance) {
    // Tick down freeze counters
    const next = {};
    for (const [sq, t] of Object.entries(instance.meta.frozen || {})) {
      const remaining = t - 1;
      if (remaining > 0) next[sq] = remaining;
    }
    instance.meta.frozen = next;
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
