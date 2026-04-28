import { ownPieceSquares, killPiece, pickRandom } from './_helpers.js';

export default {
  onTurnEnd(session, instance) {
    // each turn, kill a random non-king piece
    const all = [...ownPieceSquares(session, 'white'), ...ownPieceSquares(session, 'black')]
      .filter(p => p.type !== 'k');
    const target = pickRandom(all);
    if (!target) return [];
    killPiece(session, target.square);
    return [
      { type: 'doomsday-strike', square: target.square, instanceId: instance.instanceId },
      { type: 'piece-killed', square: target.square },
    ];
  },
};
