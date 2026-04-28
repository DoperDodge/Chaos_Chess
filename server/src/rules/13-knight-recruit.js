import { emptyOwnHalfSquares, placePiece, pickRandom } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(emptyOwnHalfSquares(session, instance.owner));
    if (!sq) return [];
    placePiece(session, sq, 'n', instance.owner);
    return [{ type: 'pieces-spawned', squares: [sq], kind: 'n', color: instance.owner, instanceId: instance.instanceId }];
  },
};
