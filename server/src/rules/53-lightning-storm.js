import { ownPieceSquares, killPiece, pickRandom } from './_helpers.js';

export default {
  onTurnEnd(session, instance) {
    const all = [...ownPieceSquares(session, 'white'), ...ownPieceSquares(session, 'black')]
      .filter(p => p.type !== 'k');
    const target = pickRandom(all);
    if (!target) return [];
    killPiece(session, target.square);
    return [
      { type: 'lightning-strike', square: target.square, instanceId: instance.instanceId },
      { type: 'piece-killed', square: target.square },
    ];
  },
};
