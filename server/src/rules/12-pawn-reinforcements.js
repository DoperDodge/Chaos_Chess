import { ALL_SQUARES, placePiece, pickRandomMany } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const range = instance.owner === 'white' ? ['1','2'] : ['7','8'];
    const empties = ALL_SQUARES.filter(sq => range.includes(sq[1]) && !session.chess.get(sq));
    const targets = pickRandomMany(empties, 2);
    for (const sq of targets) placePiece(session, sq, 'p', instance.owner);
    return [{ type: 'pieces-spawned', squares: targets, kind: 'p', color: instance.owner, instanceId: instance.instanceId }];
  },
};
