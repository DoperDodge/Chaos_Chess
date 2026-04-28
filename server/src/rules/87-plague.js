import { ALL_SQUARES, adjacentSquares, killPiece, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Plague: infect a random opponent piece. Each turn end, spread to one random
// adjacent piece. After 4 ticks of being infected, a piece dies.
export default {
  onActivate(session, instance) {
    const opponent = instance.owner === 'white' ? 'b' : 'w';
    const candidates = [];
    for (const sq of ALL_SQUARES) {
      const p = session.chess.get(sq);
      if (p && p.color === opponent && p.type !== 'k') candidates.push(sq);
    }
    const start = pickRandom(candidates);
    if (!start) return [];
    instance.meta.infected = { [start]: 0 }; // sq -> ticks
    addPieceEffect(session, start, { type: 'plague', instanceId: instance.instanceId });
    return [{ type: 'plague-start', square: start, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    const events = [];
    const infected = instance.meta.infected || {};
    // Tick existing infections; kill those at 4
    const dying = [];
    for (const [sq, ticks] of Object.entries(infected)) {
      if (!session.chess.get(sq)) { delete infected[sq]; continue; }
      infected[sq] = ticks + 1;
      if (infected[sq] >= 4) dying.push(sq);
    }
    for (const sq of dying) {
      killPiece(session, sq);
      delete infected[sq];
      events.push({ type: 'piece-killed', square: sq });
    }
    // Spread: pick one infected piece, infect a random adjacent
    const sources = Object.keys(infected);
    if (sources.length) {
      const src = pickRandom(sources);
      const adj = adjacentSquares(src).filter(a => session.chess.get(a) && !infected[a] && session.chess.get(a).type !== 'k');
      const dest = pickRandom(adj);
      if (dest) {
        infected[dest] = 0;
        addPieceEffect(session, dest, { type: 'plague', instanceId: instance.instanceId });
        events.push({ type: 'plague-spread', from: src, to: dest, instanceId: instance.instanceId });
      }
    }
    instance.meta.infected = infected;
    return events;
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
