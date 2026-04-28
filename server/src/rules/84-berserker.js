import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const target = pickRandom(own);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'berserker', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: target.square, kind: 'berserker', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
