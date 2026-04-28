import { ALL_SQUARES, addTileEffect, pickRandom, killPiece, adjacentSquares, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES);
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'doomsday', instanceId: instance.instanceId });
    return [{ type: 'doomsday-tile-marked', square: sq, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const sq = instance.meta.tile;
    const events = [{ type: 'explosion', center: sq, radius: 1, instanceId: instance.instanceId }];
    const targets = [sq, ...adjacentSquares(sq)];
    for (const t of targets) {
      const p = session.chess.get(t);
      if (p && p.type !== 'k') { killPiece(session, t); events.push({ type: 'piece-killed', square: t }); }
    }
    removeTileEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
