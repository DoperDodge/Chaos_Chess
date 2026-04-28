import { ALL_SQUARES, addTileEffect, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES);
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'pause-tile', instanceId: instance.instanceId });
    return [{ type: 'pause-tile-set', square: sq, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.from === instance.meta.tile || ctx.to === instance.meta.tile) {
      return [{ type: 'move-blocked', reason: 'tile is paused' }];
    }
    return [];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
