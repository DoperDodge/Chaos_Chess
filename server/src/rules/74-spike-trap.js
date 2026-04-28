import { squaresInRow, addTileEffect, killPiece, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const rank = String(1 + Math.floor(Math.random() * 8));
    instance.meta.tiles = squaresInRow(rank);
    for (const sq of instance.meta.tiles) {
      addTileEffect(session, sq, { type: 'spike-warning', instanceId: instance.instanceId });
    }
    return [{ type: 'spike-warning', tiles: instance.meta.tiles, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const events = [];
    for (const sq of instance.meta.tiles || []) {
      const p = session.chess.get(sq);
      if (p && p.type !== 'k') {
        killPiece(session, sq);
        events.push({ type: 'piece-killed', square: sq });
      }
    }
    events.push({ type: 'spike-trap-triggered', tiles: instance.meta.tiles, instanceId: instance.instanceId });
    removeTileEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
