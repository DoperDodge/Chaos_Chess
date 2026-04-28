import { ALL_SQUARES, addTileEffect, pickRandomMany, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(sq => !session.chess.get(sq));
    const tiles = pickRandomMany(empties, 3);
    instance.meta.tiles = tiles;
    instance.meta.stuck = {}; // sq -> remaining stuck turns for piece on it
    for (const sq of tiles) addTileEffect(session, sq, { type: 'quicksand', instanceId: instance.instanceId });
    return [{ type: 'quicksand-tiles', tiles, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move) return [];
    if (instance.meta.tiles?.includes(move.to)) {
      instance.meta.stuck[move.to] = 1; // can't move next turn
    }
    return [];
  },
  onMoveAttempt(session, instance, ctx) {
    if (instance.meta.stuck?.[ctx.from]) {
      return [{ type: 'move-blocked', reason: 'piece is stuck in quicksand' }];
    }
    return [];
  },
  onTurnEnd(session, instance) {
    // Decrement stuck counters
    for (const sq of Object.keys(instance.meta.stuck || {})) {
      instance.meta.stuck[sq] = Math.max(0, instance.meta.stuck[sq] - 1);
      if (instance.meta.stuck[sq] === 0) delete instance.meta.stuck[sq];
    }
    return [];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
