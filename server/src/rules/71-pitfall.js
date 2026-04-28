import { ALL_SQUARES, addTileEffect, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES.filter(s => !session.chess.get(s)));
    if (!sq) return [];
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'pit', instanceId: instance.instanceId, owner: instance.owner });
    return [{ type: 'pit-placed', square: sq, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.to !== instance.meta.tile) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(ctx.move.to);
    instance.turnsRemaining = 0;
    return [{ type: 'pit-triggered', square: ctx.move.to, instanceId: instance.instanceId }, { type: 'piece-killed', square: ctx.move.to }];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
