import { ALL_SQUARES, placePiece, pickRandomMany } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(sq => !session.chess.get(sq));
    const dead = session.deadPieces || [];
    const count = Math.min(dead.length, empties.length);
    const tiles = pickRandomMany(empties, count);
    instance.meta.tiles = tiles;
    for (const sq of tiles) {
      placePiece(session, sq, 'p', instance.owner);
    }
    return [{ type: 'skeleton-uprising', squares: tiles, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    // 1-turn duration; on expire, remove the skeletons we placed
    if (instance.turnsRemaining > 1) return [];
    const events = [];
    for (const sq of instance.meta.tiles || []) {
      const p = session.chess.get(sq);
      if (p && p.type === 'p') {
        if (typeof session.chess.remove === 'function') session.chess.remove(sq);
        events.push({ type: 'piece-killed', square: sq });
      }
    }
    return events;
  },
};
