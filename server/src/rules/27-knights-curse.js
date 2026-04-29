// Knight's Curse: all knights move only in straight lines (rook-like, max 3 tiles).
import { fileIndex, rankIndex, squareFrom } from './_helpers.js';

export default {
  onActivate(session, instance) {
    return [{ type: 'knights-curse', instanceId: instance.instanceId }];
  },
  // Replace the knight's normal moves with rook-like 1..3 step lines.
  restrictMoves(session, instance, fromSq, candidates) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'n') return candidates;
    return []; // strip native knight moves
  },
  extraMoves(session, instance, fromSq) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'n') return [];
    const out = [];
    const fi = fileIndex(fromSq), ri = rankIndex(fromSq);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dy] of dirs) {
      for (let step = 1; step <= 3; step++) {
        const to = squareFrom(fi + dx * step, ri + dy * step);
        if (!to) break;
        const dest = session.chess.get(to);
        if (dest && dest.color === piece.color) break;
        if (dest && dest.type === 'k') break;
        out.push({ to, piece: 'n', captured: dest?.type });
        if (dest) break;
      }
    }
    return out;
  },
};
