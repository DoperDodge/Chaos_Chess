import { ALL_SQUARES, adjacentSquares, pickRandomMany, pickRandom } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const candidates = ALL_SQUARES
      .map(sq => ({ sq, p: session.chess.get(sq) }))
      .filter(x => x.p && x.p.type !== 'k');
    const five = pickRandomMany(candidates, 5);
    const events = [];
    for (const c of five) {
      const dest = pickRandom(adjacentSquares(c.sq).filter(s => !session.chess.get(s)));
      if (!dest) continue;
      if (typeof session.chess.remove === 'function') session.chess.remove(c.sq);
      if (typeof session.chess.put === 'function') session.chess.put(c.p, dest);
      events.push({ type: 'earthquake-shift', from: c.sq, to: dest });
    }
    instance.turnsRemaining = 0;
    return events;
  },
};
