import { ownPieceSquares, killPiece, pickRandom } from './_helpers.js';

export default {
  onTurnEnd(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const target = pickRandom(own);
    if (!target) return [];
    killPiece(session, target.square);
    return [{ type: 'cursed-strike', square: target.square, instanceId: instance.instanceId }, { type: 'piece-killed', square: target.square }];
  },
};
