import { ALL_SQUARES, fileIndex, rankIndex, squareFrom, pickRandom } from './_helpers.js';

// Auto-target: find a random opponent non-king piece and move it to a random adjacent empty tile.
export default {
  onActivate(session, instance) {
    const opponent = instance.owner === 'white' ? 'b' : 'w';
    const candidates = [];
    for (const sq of ALL_SQUARES) {
      const p = session.chess.get(sq);
      if (p && p.color === opponent && p.type !== 'k') candidates.push({ sq, p });
    }
    const pick = pickRandom(candidates);
    if (!pick) return [];
    const fi = fileIndex(pick.sq), ri = rankIndex(pick.sq);
    const dests = [];
    for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const d = squareFrom(fi + df, ri + dr);
      if (d && !session.chess.get(d)) dests.push(d);
    }
    const dest = pickRandom(dests);
    if (!dest) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(pick.sq);
    if (typeof session.chess.put === 'function') session.chess.put(pick.p, dest);
    instance.turnsRemaining = 0;
    return [{ type: 'mind-control', from: pick.sq, to: dest, instanceId: instance.instanceId }];
  },
};
