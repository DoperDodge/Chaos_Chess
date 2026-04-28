import { ALL_SQUARES, fileIndex, rankIndex, squareFrom } from './_helpers.js';

// One-shot: every piece tries to slide one tile toward the opposite end of the board.
// White pieces slide toward rank 8, black pieces toward rank 1. Blocked by other pieces or edges.
export default {
  onActivate(session, instance) {
    const events = [];
    // Process from far rank inward so pieces don't collide
    const ranks = [...'12345678'];
    const order = [...ranks]; // process bottom-up for white, top-down for black
    const moves = [];
    for (const sq of ALL_SQUARES) {
      const p = session.chess.get(sq);
      if (!p) continue;
      const dir = p.color === 'w' ? 1 : -1;
      const fi = fileIndex(sq), ri = rankIndex(sq);
      const dest = squareFrom(fi, ri + dir);
      if (!dest || session.chess.get(dest)) continue;
      moves.push({ from: sq, to: dest, piece: p });
    }
    // Apply
    for (const m of moves) {
      if (typeof session.chess.remove === 'function') session.chess.remove(m.from);
      if (typeof session.chess.put === 'function') session.chess.put(m.piece, m.to);
    }
    instance.turnsRemaining = 0;
    events.push({ type: 'reverse-gravity', count: moves.length, instanceId: instance.instanceId });
    return events;
  },
};
