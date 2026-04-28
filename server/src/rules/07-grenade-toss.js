import { ownPieceSquares, adjacentSquares, addTileEffect, killPiece, pickRandom, shiftSquare, removeTileEffectsByInstance } from './_helpers.js';

// Auto-targeted: pick a random tile within 3 squares of one of the owner's pieces.
export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner);
    const center = pickRandom(own);
    if (!center) return [];
    const candidates = [];
    for (let df = -3; df <= 3; df++) {
      for (let dr = -3; dr <= 3; dr++) {
        const sq = shiftSquare(center.square, df, dr);
        if (sq) candidates.push(sq);
      }
    }
    const target = pickRandom(candidates);
    if (!target) return [];
    instance.meta.target = target;
    const cross = [target, ...adjacentSquares(target, false)];
    instance.meta.tiles = cross;
    for (const sq of cross) addTileEffect(session, sq, { type: 'volcano-warning', instanceId: instance.instanceId });
    return [{ type: 'grenade-thrown', tiles: cross, target, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const events = [];
    for (const sq of instance.meta.tiles || []) {
      const p = session.chess.get(sq);
      events.push({ type: 'explosion', center: sq, radius: 0, instanceId: instance.instanceId });
      if (p && p.type !== 'k') { killPiece(session, sq); events.push({ type: 'piece-killed', square: sq }); }
    }
    removeTileEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
