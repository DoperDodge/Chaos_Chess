import { ALL_SQUARES, fileIndex, rankIndex, squareFrom, killPiece } from './_helpers.js';

// Tsunami: pushes all pieces one tile back per turn for 2 turns; pieces that can't move are washed off.
export default {
  onActivate(session, instance) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
    instance.meta.dx = dx; instance.meta.dy = dy;
    return [{ type: 'tsunami-warning', dx, dy, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    const dx = instance.meta.dx, dy = instance.meta.dy;
    const events = [];
    const moves = [];
    const drowned = [];
    for (const sq of ALL_SQUARES) {
      const p = session.chess.get(sq);
      if (!p) continue;
      const dest = squareFrom(fileIndex(sq) + dx, rankIndex(sq) + dy);
      if (!dest) { drowned.push(sq); continue; }
      if (session.chess.get(dest)) continue;
      moves.push({ from: sq, to: dest, piece: p });
    }
    for (const m of moves) {
      if (typeof session.chess.remove === 'function') session.chess.remove(m.from);
      if (typeof session.chess.put === 'function') session.chess.put(m.piece, m.to);
    }
    for (const sq of drowned) {
      const p = session.chess.get(sq);
      if (p && p.type !== 'k') {
        killPiece(session, sq);
        events.push({ type: 'piece-killed', square: sq });
      }
    }
    events.push({ type: 'tsunami-wave', count: moves.length, instanceId: instance.instanceId });
    return events;
  },
};
