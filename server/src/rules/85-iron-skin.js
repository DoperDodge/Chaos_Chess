import { ownPieceSquares, pickRandom, addPieceEffect, placePiece, removePieceEffectsByInstance } from './_helpers.js';

// Iron Skin: pick a random own piece. Resurrect it on first capture during the rule's lifetime.
export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const target = pickRandom(own);
    if (!target) return [];
    instance.meta.square = target.square;
    instance.meta.type = target.type;
    instance.meta.uses = 1;
    addPieceEffect(session, target.square, { type: 'iron-skin', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: target.square, kind: 'iron-skin', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    if (ctx.move?.captured && ctx.move.to === instance.meta.square && instance.meta.uses > 0) {
      if (typeof session.chess.remove === 'function') session.chess.remove(ctx.move.to);
      placePiece(session, ctx.move.to, instance.meta.type, instance.owner);
      instance.meta.uses -= 1;
      return [{ type: 'iron-skin-saved', square: ctx.move.to, instanceId: instance.instanceId }];
    }
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
