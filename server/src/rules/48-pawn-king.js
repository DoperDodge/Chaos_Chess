import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Pawn King: visual buff. Treating it as a check-target requires bigger
// game-loop changes; we mark the pawn so the player can see the effect.
export default {
  onActivate(session, instance) {
    const pawns = ownPieceSquares(session, instance.owner).filter(p => p.type === 'p');
    const target = pickRandom(pawns);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'pawn-king', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: target.square, kind: 'pawn-king', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
