import { ALL_SQUARES, adjacentSquares, fileIndex, rankIndex, squareFrom, pickRandom, addTileEffect, removeTileEffectsByInstance } from './_helpers.js';

// Pulls every adjacent enemy piece one tile toward the magnetic tile (if possible).
export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES);
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'magnet', instanceId: instance.instanceId });
    const fi = fileIndex(sq), ri = rankIndex(sq);
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    const events = [{ type: 'magnetic-pull', square: sq, instanceId: instance.instanceId }];
    for (const adj of adjacentSquares(sq)) {
      const p = session.chess.get(adj);
      if (!p || p.color === ownerChar) continue;
      const dx = Math.sign(fi - fileIndex(adj));
      const dy = Math.sign(ri - rankIndex(adj));
      const dest = squareFrom(fileIndex(adj) + dx, rankIndex(adj) + dy);
      if (!dest || session.chess.get(dest)) continue;
      if (typeof session.chess.remove === 'function') session.chess.remove(adj);
      if (typeof session.chess.put === 'function') session.chess.put(p, dest);
      events.push({ type: 'magnetic-shift', from: adj, to: dest });
    }
    instance.turnsRemaining = 0;
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
