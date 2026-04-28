import { emptyOwnHalfSquares, addTileEffect, killPiece, placePiece, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(emptyOwnHalfSquares(session, instance.owner));
    if (!sq) return [];
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'doomsday', instanceId: instance.instanceId });
    return [{ type: 'royal-recruit-marked', square: sq, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const sq = instance.meta.tile;
    const events = [];
    const occupant = session.chess.get(sq);
    if (occupant && occupant.type !== 'k') {
      killPiece(session, sq);
      events.push({ type: 'piece-killed', square: sq });
    }
    placePiece(session, sq, 'r', instance.owner);
    events.push({ type: 'pieces-spawned', squares: [sq], kind: 'r', color: instance.owner, instanceId: instance.instanceId });
    events.push({ type: 'explosion', center: sq, radius: 0, instanceId: instance.instanceId });
    removeTileEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
