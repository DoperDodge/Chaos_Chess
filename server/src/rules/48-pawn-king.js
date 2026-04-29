// Pawn King: the tagged pawn can move like a king (one tile in any direction).
import { ownPieceSquares, pickRandom, addPieceEffect, fileIndex, rankIndex, squareFrom, removePieceEffectsByInstance } from './_helpers.js';

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
  extraMoves(session, instance, fromSq) {
    if (fromSq !== instance.meta.square) return [];
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'p') return [];
    const out = [];
    const fi = fileIndex(fromSq), ri = rankIndex(fromSq);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const to = squareFrom(fi + dx, ri + dy);
      if (!to) continue;
      const t = session.chess.get(to);
      if (t && t.color === piece.color) continue;
      if (t && t.type === 'k') continue;
      out.push({ to, piece: 'p', captured: t?.type });
    }
    return out;
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
