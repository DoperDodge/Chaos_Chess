import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Visual marker — granting knight movement to a pawn requires a move-validator override.
export default {
  onActivate(session, instance) {
    const pawns = ownPieceSquares(session, instance.owner).filter(p => p.type === 'p');
    const target = pickRandom(pawns);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'berserker-pawn', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: target.square, kind: 'berserker-pawn', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
