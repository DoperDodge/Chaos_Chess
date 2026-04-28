import { findKingSquare, fileIndex, rankIndex, squareFrom } from './_helpers.js';

// Dance Off: each turn end, both kings move one tile toward the center if possible.
// Cannot be captured during the rule (block captures targeting either king).
export default {
  onActivate(session, instance) {
    return [{ type: 'dance-off', instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    const target = session.chess.get(ctx.to);
    if (target && target.type === 'k') {
      return [{ type: 'move-blocked', reason: 'kings are dancing — no capture' }];
    }
    return [];
  },
  onTurnEnd(session, instance) {
    const events = [];
    for (const color of ['white', 'black']) {
      const sq = findKingSquare(session, color);
      if (!sq) continue;
      const fi = fileIndex(sq), ri = rankIndex(sq);
      const cf = 3.5, cr = 3.5;
      const df = fi < cf ? 1 : fi > cf ? -1 : 0;
      const dr = ri < cr ? 1 : ri > cr ? -1 : 0;
      const dest = squareFrom(fi + df, ri + dr);
      if (!dest || session.chess.get(dest)) continue;
      const p = session.chess.get(sq);
      if (typeof session.chess.remove === 'function') session.chess.remove(sq);
      if (typeof session.chess.put === 'function') session.chess.put(p, dest);
      events.push({ type: 'dance-step', color, from: sq, to: dest, instanceId: instance.instanceId });
    }
    return events;
  },
};
