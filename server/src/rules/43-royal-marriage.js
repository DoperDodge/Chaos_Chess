import { findKingSquare, addPieceEffect, removePieceEffectsByInstance, colorChar } from './_helpers.js';

// Royal Marriage: temporarily turn owner's king into a queen, restore on expire.
export default {
  onActivate(session, instance) {
    const kingSq = findKingSquare(session, instance.owner);
    if (!kingSq) return [];
    instance.meta.kingSquare = kingSq;
    if (typeof session.chess.remove === 'function' && typeof session.chess.put === 'function') {
      session.chess.remove(kingSq);
      session.chess.put({ type: 'q', color: colorChar(instance.owner) }, kingSq);
    }
    addPieceEffect(session, kingSq, { type: 'royal-marriage', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: kingSq, kind: 'royal-marriage', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.kingSquare) instance.meta.kingSquare = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) {
    const sq = instance.meta.kingSquare;
    if (sq && session.chess.get(sq)) {
      if (typeof session.chess.remove === 'function' && typeof session.chess.put === 'function') {
        session.chess.remove(sq);
        session.chess.put({ type: 'k', color: colorChar(instance.owner) }, sq);
      }
    }
    removePieceEffectsByInstance(session, instance.instanceId);
    return [];
  },
};
