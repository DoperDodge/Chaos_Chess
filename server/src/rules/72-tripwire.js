import { squaresInRow, squaresInColumn, addTileEffect, removeTileEffectsByInstance } from './_helpers.js';

// Auto-target: random row OR column, kills first opponent piece to cross.
export default {
  onActivate(session, instance) {
    const isRow = Math.random() < 0.5;
    if (isRow) {
      const rank = String(1 + Math.floor(Math.random() * 8));
      instance.meta.tiles = squaresInRow(rank);
    } else {
      const file = ['a','b','c','d','e','f','g','h'][Math.floor(Math.random() * 8)];
      instance.meta.tiles = squaresInColumn(file);
    }
    for (const sq of instance.meta.tiles) {
      addTileEffect(session, sq, { type: 'tripwire', instanceId: instance.instanceId, owner: instance.owner });
    }
    return [{ type: 'tripwire-set', tiles: instance.meta.tiles, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (!ctx.move || !instance.meta.tiles?.includes(ctx.move.to)) return [];
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (ctx.move.color === ownerChar) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(ctx.move.to);
    instance.turnsRemaining = 0;
    return [{ type: 'tripwire-triggered', square: ctx.move.to, instanceId: instance.instanceId }, { type: 'piece-killed', square: ctx.move.to }];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
