import { placePiece } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const corner = instance.owner === 'white' ? 'h1' : 'a8';
    const altCorner = instance.owner === 'white' ? 'a1' : 'h8';
    let target = null;
    if (!session.chess.get(corner)) target = corner;
    else if (!session.chess.get(altCorner)) target = altCorner;
    if (!target) return [];
    placePiece(session, target, 'r', instance.owner);
    return [{ type: 'pieces-spawned', squares: [target], kind: 'r', color: instance.owner, instanceId: instance.instanceId }];
  },
};
