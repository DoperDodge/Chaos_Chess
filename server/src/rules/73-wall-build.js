import { ALL_SQUARES, addTileEffect, pickRandomMany, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(sq => !session.chess.get(sq));
    const tiles = pickRandomMany(empties, 3);
    instance.meta.tiles = tiles;
    for (const sq of tiles) addTileEffect(session, sq, { type: 'wall', instanceId: instance.instanceId });
    return [{ type: 'walls-built', tiles, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (instance.meta.tiles?.includes(ctx.to)) {
      return [{ type: 'move-blocked', reason: 'wall in the way' }];
    }
    return [];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
