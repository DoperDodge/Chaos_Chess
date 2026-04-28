import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Decoy King: visual trick. We mark a pawn as "decoy" — the client could swap
// the rendered glyph for the opponent. Server doesn't change check rules.
export default {
  onActivate(session, instance) {
    const pawns = ownPieceSquares(session, instance.owner).filter(p => p.type === 'p');
    const target = pickRandom(pawns);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'decoy-king', instanceId: instance.instanceId, owner: instance.owner });
    return [{ type: 'decoy-king-set', square: target.square, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
