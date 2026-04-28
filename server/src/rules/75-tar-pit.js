import { ALL_SQUARES, addTileEffect, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES);
    instance.meta.tile = sq;
    instance.meta.stuck = {}; // square (last known location of stuck piece) -> turns
    addTileEffect(session, sq, { type: 'tar', instanceId: instance.instanceId });
    return [{ type: 'tar-pit-set', square: sq, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.to === instance.meta.tile) {
      instance.meta.stuck[ctx.move.to] = 3;
    }
    return [];
  },
  onMoveAttempt(session, instance, ctx) {
    if (instance.meta.stuck?.[ctx.from]) {
      return [{ type: 'move-blocked', reason: 'piece is stuck in tar' }];
    }
    return [];
  },
  onTurnEnd(session, instance) {
    const next = {};
    for (const [sq, t] of Object.entries(instance.meta.stuck || {})) {
      const r = t - 1;
      if (r > 0) next[sq] = r;
    }
    instance.meta.stuck = next;
    return [];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
