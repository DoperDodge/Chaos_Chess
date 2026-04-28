import { ownPieceSquares, pickRandom, addPieceEffect, placePiece, colorChar, removePieceEffectsByInstance } from './_helpers.js';

// Iron Rook: a random own rook gains 2 HP. We track HP via instance meta and
// resurrect on first capture.
export default {
  onActivate(session, instance) {
    const rooks = ownPieceSquares(session, instance.owner).filter(p => p.type === 'r');
    const target = pickRandom(rooks);
    if (!target) return [];
    instance.meta.square = target.square;
    instance.meta.hp = 2;
    addPieceEffect(session, target.square, { type: 'iron-rook', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: target.square, kind: 'iron-rook', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    if (ctx.move?.captured && ctx.move.to === instance.meta.square) {
      // Iron rook was captured. If HP > 1, resurrect it.
      if (instance.meta.hp > 1) {
        instance.meta.hp -= 1;
        if (typeof session.chess.remove === 'function') session.chess.remove(ctx.move.to);
        placePiece(session, ctx.move.to, 'r', instance.owner);
        return [{ type: 'iron-rook-saved', square: ctx.move.to, instanceId: instance.instanceId }];
      }
    }
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
