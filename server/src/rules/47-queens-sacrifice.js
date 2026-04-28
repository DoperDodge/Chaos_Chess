import { ALL_SQUARES, adjacentSquares, killPiece, placePiece } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    const queenSq = ALL_SQUARES.find(sq => {
      const p = session.chess.get(sq);
      return p && p.type === 'q' && p.color === ownerChar;
    });
    if (!queenSq) return [];
    killPiece(session, queenSq);
    const events = [{ type: 'piece-killed', square: queenSq }];
    const adj = adjacentSquares(queenSq).filter(sq => !session.chess.get(sq));
    const placed = adj.slice(0, 4);
    for (const sq of placed) placePiece(session, sq, 'p', instance.owner);
    if (placed.length) events.push({ type: 'pieces-spawned', squares: placed, kind: 'p', color: instance.owner, instanceId: instance.instanceId });
    return events;
  },
};
