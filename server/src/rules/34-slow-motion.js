// Slow Motion: opponent pieces can only move 1 tile per move.
// Knights can still jump, but to adjacent jump destinations only (any
// of their 8 patterns is fine; the spec is loose on this).
import { fileIndex, rankIndex } from './_helpers.js';

export default {
  onActivate(session, instance) {
    return [{ type: 'slow-motion', target: instance.owner === 'white' ? 'black' : 'white', instanceId: instance.instanceId }];
  },
  restrictMoves(session, instance, fromSq, candidates) {
    const opponent = instance.owner === 'white' ? 'black' : 'white';
    const cc = opponent === 'white' ? 'w' : 'b';
    const piece = session.chess.get(fromSq);
    if (!piece || piece.color !== cc) return candidates;
    if (piece.type === 'n') return candidates; // knights still jump
    const fi = fileIndex(fromSq), ri = rankIndex(fromSq);
    return candidates.filter(c => {
      const dx = Math.abs(fileIndex(c.to) - fi);
      const dy = Math.abs(rankIndex(c.to) - ri);
      return Math.max(dx, dy) <= 1;
    });
  },
};
