import { addTileEffect, killPiece, removeTileEffectsByInstance } from './_helpers.js';

const CENTER = ['d4', 'e4', 'd5', 'e5'];

export default {
  onActivate(session, instance) {
    for (const sq of CENTER) addTileEffect(session, sq, { type: 'volcano-warning', instanceId: instance.instanceId });
    return [{ type: 'volcano-warning', tiles: CENTER, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    const events = [];
    for (const sq of CENTER) {
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
