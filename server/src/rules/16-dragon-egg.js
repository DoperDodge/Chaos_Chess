import { ALL_SQUARES, addTileEffect, removeTileEffectsByInstance, placePiece, pickRandom, killPiece, pieceAt } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES.filter(s => !session.chess.get(s)));
    if (!sq) return [];
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'dragon-egg', instanceId: instance.instanceId });
    return [{ type: 'dragon-egg-laid', square: sq, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    const sq = instance.meta.tile;
    const events = [];
    const occupant = pieceAt(session, sq);
    if (occupant && occupant.type !== 'k') { killPiece(session, sq); events.push({ type: 'piece-killed', square: sq }); }
    placePiece(session, sq, 'q', instance.owner); // dragon = queen
    events.push({ type: 'pieces-spawned', squares: [sq], kind: 'q', color: instance.owner, instanceId: instance.instanceId });
    events.push({ type: 'rule-activated', rule: { name: 'DRAGON HATCHED' } });
    removeTileEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
