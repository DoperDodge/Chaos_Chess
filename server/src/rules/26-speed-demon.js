// Speed Demon: pick one of your pieces; for 3 turns it moves like a queen.
// Implementation: tag a piece. On move attempt by that piece, allow queen-pattern moves by
// promoting it virtually. Simplification: temporarily replace the piece with a queen
// of the same color and restore on rule end.
import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k' && p.type !== 'q');
    const target = pickRandom(own);
    if (!target) return [];
    instance.meta.originalSquare = target.square;
    instance.meta.originalType = target.type;
    // Temporarily promote
    if (typeof session.chess.remove === 'function' && typeof session.chess.put === 'function') {
      const colorChar = instance.owner === 'white' ? 'w' : 'b';
      session.chess.remove(target.square);
      session.chess.put({ type: 'q', color: colorChar }, target.square);
    }
    addPieceEffect(session, target.square, { type: 'speed-demon', instanceId: instance.instanceId });
    return [{ type: 'piece-buffed', square: target.square, kind: 'speed-demon', instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    // Track where the buffed piece is now (in case it moved)
    const move = ctx.move;
    if (!move) return [];
    if (move.from === instance.meta.originalSquare) {
      instance.meta.originalSquare = move.to;
    }
    return [];
  },
  onDeactivate(session, instance) {
    removePieceEffectsByInstance(session, instance.instanceId);
    // Demote: replace queen with original type if still present
    const sq = instance.meta.originalSquare;
    if (sq && session.chess.get(sq)) {
      const colorChar = instance.owner === 'white' ? 'w' : 'b';
      if (typeof session.chess.remove === 'function' && typeof session.chess.put === 'function') {
        session.chess.remove(sq);
        session.chess.put({ type: instance.meta.originalType, color: colorChar }, sq);
      }
    }
    return [];
  },
};
