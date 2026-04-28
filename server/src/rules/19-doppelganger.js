import { ownPieceSquares, emptyOwnHalfSquares, placePiece, pickRandom } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const src = pickRandom(own);
    if (!src) return [];
    const dst = pickRandom(emptyOwnHalfSquares(session, instance.owner));
    if (!dst) return [];
    placePiece(session, dst, src.type, instance.owner);
    return [{ type: 'pieces-spawned', squares: [dst], kind: src.type, color: instance.owner, instanceId: instance.instanceId }];
  },
};
