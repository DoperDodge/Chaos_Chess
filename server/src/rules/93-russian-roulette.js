import { ownPieceSquares, killPiece, pickRandom, pickRandomMany } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const six = pickRandomMany(own, 6);
    if (!six.length) return [];
    const victim = pickRandom(six);
    killPiece(session, victim.square);
    return [
      { type: 'roulette', candidates: six.map(c => c.square), victim: victim.square, instanceId: instance.instanceId },
      { type: 'piece-killed', square: victim.square },
    ];
  },
};
