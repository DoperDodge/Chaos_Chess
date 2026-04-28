import { ALL_SQUARES, killPiece, addTileEffect, pickRandomMany, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const tiles = pickRandomMany(ALL_SQUARES, 5);
    instance.meta.tiles = tiles;
    for (const sq of tiles) {
      addTileEffect(session, sq, { type: 'cluster-marker', instanceId: instance.instanceId, fuse: 3 });
    }
    return [{ type: 'cluster-marked', tiles, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const events = [];
    for (const sq of instance.meta.tiles || []) {
      const p = session.chess.get(sq);
      events.push({ type: 'explosion', center: sq, radius: 0, instanceId: instance.instanceId });
      if (p && p.type !== 'k') {
        killPiece(session, sq);
        events.push({ type: 'piece-killed', square: sq });
      }
    }
    removeTileEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
