import { squaresInRow, squaresInColumn, addTileEffect, killPiece, removeTileEffectsByInstance } from './_helpers.js';

// Auto-targeted: server randomly picks a row OR column.
export default {
  onActivate(session, instance) {
    const isRow = Math.random() < 0.5;
    if (isRow) {
      const rank = String(1 + Math.floor(Math.random() * 8));
      instance.meta.tiles = squaresInRow(rank);
      instance.meta.kind = `row ${rank}`;
    } else {
      const file = ['a','b','c','d','e','f','g','h'][Math.floor(Math.random() * 8)];
      instance.meta.tiles = squaresInColumn(file);
      instance.meta.kind = `column ${file.toUpperCase()}`;
    }
    for (const sq of instance.meta.tiles) {
      addTileEffect(session, sq, { type: 'volcano-warning', instanceId: instance.instanceId });
    }
    return [{ type: 'nuclear-warning', tiles: instance.meta.tiles, kind: instance.meta.kind, instanceId: instance.instanceId }];
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
