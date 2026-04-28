import { ALL_SQUARES, addTileEffect, killPiece, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

// Auto-targeted: server places the mine on a random empty tile.
export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(sq => !session.chess.get(sq));
    const sq = pickRandom(empties);
    if (!sq) return [];
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'mine', instanceId: instance.instanceId, owner: instance.owner });
    return [{ type: 'mine-placed', square: sq, instanceId: instance.instanceId, owner: instance.owner }];
  },
  onMoveEnd(session, instance, ctx) {
    if (!ctx.move || ctx.move.to !== instance.meta.tile) return [];
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (ctx.move.color === ownerChar) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(ctx.move.to);
    instance.turnsRemaining = 0;
    return [
      { type: 'explosion', center: ctx.move.to, radius: 0, instanceId: instance.instanceId },
      { type: 'piece-killed', square: ctx.move.to },
    ];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
