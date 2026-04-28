import { ALL_SQUARES, fileIndex, rankIndex, squareFrom, pickRandom } from './_helpers.js';

// Auto-target: pick a random opponent pawn and shove it forward (their direction).
export default {
  onActivate(session, instance) {
    const opponentChar = instance.owner === 'white' ? 'b' : 'w';
    const opponentColor = opponentChar === 'w' ? 'white' : 'black';
    const candidates = [];
    for (const sq of ALL_SQUARES) {
      const p = session.chess.get(sq);
      if (p && p.color === opponentChar && p.type === 'p') candidates.push({ sq, p });
    }
    const pick = pickRandom(candidates);
    if (!pick) return [];
    const dir = opponentColor === 'white' ? 1 : -1;
    const dest = squareFrom(fileIndex(pick.sq), rankIndex(pick.sq) + dir);
    if (!dest || session.chess.get(dest)) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(pick.sq);
    if (typeof session.chess.put === 'function') session.chess.put(pick.p, dest);
    instance.turnsRemaining = 0;
    return [{ type: 'possession', from: pick.sq, to: dest, instanceId: instance.instanceId }];
  },
};
