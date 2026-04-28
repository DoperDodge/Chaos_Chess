import { ownPieceSquares, pickRandomMany, colorChar } from './_helpers.js';

// Auto-target: pick two random own pieces and swap their tiles.
export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const pair = pickRandomMany(own, 2);
    if (pair.length < 2) return [];
    const [a, b] = pair;
    const cc = colorChar(instance.owner);
    if (typeof session.chess.remove === 'function' && typeof session.chess.put === 'function') {
      session.chess.remove(a.square);
      session.chess.remove(b.square);
      session.chess.put({ type: a.type, color: cc }, b.square);
      session.chess.put({ type: b.type, color: cc }, a.square);
    }
    instance.turnsRemaining = 0;
    return [{ type: 'mind-swap', a: a.square, b: b.square, instanceId: instance.instanceId }];
  },
};
