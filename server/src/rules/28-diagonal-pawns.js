// Diagonal Pawns: pawns move diagonally forward only and capture straight forward.
import { fileIndex, rankIndex, squareFrom, colorChar } from './_helpers.js';

export default {
  onActivate(session, instance) {
    return [{ type: 'diagonal-pawns', instanceId: instance.instanceId }];
  },
  restrictMoves(session, instance, fromSq, candidates) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'p') return candidates;
    return []; // strip native pawn moves; we replace them via extraMoves
  },
  extraMoves(session, instance, fromSq) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'p') return [];
    const dir = piece.color === 'w' ? 1 : -1;
    const fi = fileIndex(fromSq), ri = rankIndex(fromSq);
    const out = [];
    // Diagonal forward = quiet move (push)
    for (const df of [-1, 1]) {
      const to = squareFrom(fi + df, ri + dir);
      if (!to) continue;
      if (!session.chess.get(to)) out.push({ to, piece: 'p' });
    }
    // Straight forward = capture
    const fwd = squareFrom(fi, ri + dir);
    if (fwd) {
      const t = session.chess.get(fwd);
      if (t && t.color !== piece.color && t.type !== 'k') {
        out.push({ to: fwd, piece: 'p', captured: t.type });
      }
    }
    return out;
  },
};
