import { ALL_SQUARES, fileIndex, rankIndex, squareFrom } from './_helpers.js';

// Mirror Board: at the start of each turn, swap every piece's column with its mirror (a<->h, etc.).
// We rebuild the FEN once per turn while the rule is active.
export default {
  onActivate(session, instance) {
    return [{ type: 'mirror-board', instanceId: instance.instanceId }];
  },
  onTurnStart(session, instance) {
    return mirror(session);
  },
  onTurnEnd(session, instance) {
    return mirror(session);
  },
};

function mirror(session) {
  const events = [];
  const snapshot = {};
  for (const sq of ALL_SQUARES) {
    const p = session.chess.get(sq);
    if (p) snapshot[sq] = p;
  }
  // Clear board
  for (const sq of Object.keys(snapshot)) {
    if (typeof session.chess.remove === 'function') session.chess.remove(sq);
  }
  // Place mirrored
  for (const sq of Object.keys(snapshot)) {
    const fi = fileIndex(sq), ri = rankIndex(sq);
    const mirrored = squareFrom(7 - fi, ri);
    if (mirrored && typeof session.chess.put === 'function') {
      session.chess.put(snapshot[sq], mirrored);
    }
  }
  events.push({ type: 'mirror-flipped' });
  return events;
}
