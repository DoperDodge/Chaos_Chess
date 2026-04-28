import { ALL_SQUARES, pickRandom } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const candidates = ALL_SQUARES
      .map(sq => ({ sq, p: session.chess.get(sq) }))
      .filter(x => x.p && x.p.type !== 'k');
    const t = pickRandom(candidates);
    if (!t) return [];
    const newColor = t.p.color === 'w' ? 'b' : 'w';
    if (typeof session.chess.remove === 'function' && typeof session.chess.put === 'function') {
      session.chess.remove(t.sq);
      session.chess.put({ type: t.p.type, color: newColor }, t.sq);
    }
    return [{ type: 'piece-defected', square: t.sq, newColor: newColor === 'w' ? 'white' : 'black', instanceId: instance.instanceId }];
  },
};
