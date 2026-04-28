import { ALL_SQUARES, addTileEffect, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES);
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'cursed-square', instanceId: instance.instanceId });
    return [{ type: 'cursed-square-set', square: sq, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.from === instance.meta.tile) {
      return [{ type: 'move-blocked', reason: 'piece is on a cursed square' }];
    }
    return [];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
