import { ALL_SQUARES, killPiece, pickRandomMany } from './_helpers.js';

export default {
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const all = ALL_SQUARES
      .map(sq => ({ sq, p: session.chess.get(sq) }))
      .filter(x => x.p && x.p.type !== 'k');
    const half = Math.floor(all.length / 2);
    const victims = pickRandomMany(all, half);
    const events = [{ type: 'apocalypse', squares: victims.map(v => v.sq), instanceId: instance.instanceId }];
    for (const v of victims) {
      killPiece(session, v.sq);
      events.push({ type: 'piece-killed', square: v.sq });
    }
    return events;
  },
};
