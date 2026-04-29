// Berserker Pawn: a random own pawn moves like a knight for the duration.
import { ownPieceSquares, pickRandom, addPieceEffect, fileIndex, rankIndex, squareFrom, removePieceEffectsByInstance } from './_helpers.js';

const KNIGHT_DELTAS = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];

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
  extraMoves(session, instance, fromSq) {
    if (fromSq !== instance.meta.square) return [];
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'p') return [];
    const fi = fileIndex(fromSq), ri = rankIndex(fromSq);
    const out = [];
    for (const [df, dr] of KNIGHT_DELTAS) {
      const to = squareFrom(fi + df, ri + dr);
      if (!to) continue;
      const dest = session.chess.get(to);
      if (dest && dest.color === piece.color) continue;
      if (dest && dest.type === 'k') continue; // can't capture king
      out.push({ to, piece: 'p', captured: dest?.type });
    }
    return out;
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
