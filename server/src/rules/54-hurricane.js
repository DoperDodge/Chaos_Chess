import { ALL_SQUARES, fileIndex, rankIndex, squareFrom } from './_helpers.js';

// Hurricane: shift all non-king pieces one tile in a random direction. Blocked moves are canceled.
export default {
  onActivate(session, instance) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
    instance.meta.dx = dx; instance.meta.dy = dy;
    const moves = [];
    for (const sq of ALL_SQUARES) {
      const p = session.chess.get(sq);
      if (!p || p.type === 'k') continue;
      const dest = squareFrom(fileIndex(sq) + dx, rankIndex(sq) + dy);
      if (!dest || session.chess.get(dest)) continue;
      moves.push({ from: sq, to: dest, piece: p });
    }
    for (const m of moves) {
      if (typeof session.chess.remove === 'function') session.chess.remove(m.from);
      if (typeof session.chess.put === 'function') session.chess.put(m.piece, m.to);
    }
    instance.turnsRemaining = 0;
    return [{ type: 'hurricane', dx, dy, count: moves.length, instanceId: instance.instanceId }];
  },
};
