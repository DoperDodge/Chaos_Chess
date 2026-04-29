// Snow Day: every piece moves one tile less than usual. Knights unaffected.
import { fileIndex, rankIndex } from './_helpers.js';

export default {
  onActivate(session, instance) {
    return [{ type: 'snow-day', instanceId: instance.instanceId }];
  },
  restrictMoves(session, instance, fromSq, candidates) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type === 'n') return candidates;
    // King is already 1-tile; pawns retain push-2 from start. Sliding pieces
    // (b/r/q) get capped at distance 3 (meaning of "one less" is fuzzy in
    // the spec; 3 keeps the rule meaningful without paralyzing the game).
    if (piece.type !== 'b' && piece.type !== 'r' && piece.type !== 'q') return candidates;
    const fi = fileIndex(fromSq), ri = rankIndex(fromSq);
    return candidates.filter(c => {
      const dx = Math.abs(fileIndex(c.to) - fi);
      const dy = Math.abs(rankIndex(c.to) - ri);
      return Math.max(dx, dy) <= 3;
    });
  },
};
