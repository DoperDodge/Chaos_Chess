import { ALL_SQUARES, addTileEffect, killPiece, pickRandom, removeTileEffectsByInstance, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Acid Pool: every turn end, pieces standing on the acid tile lose 1 HP. After
// 2 turns of standing, they die. We track HP via instance meta keyed by square.
export default {
  onActivate(session, instance) {
    const sq = pickRandom(ALL_SQUARES);
    instance.meta.tile = sq;
    instance.meta.hp = {}; // square -> remaining HP for piece on it
    addTileEffect(session, sq, { type: 'acid', instanceId: instance.instanceId });
    return [{ type: 'acid-pool', square: sq, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    const sq = instance.meta.tile;
    const p = session.chess.get(sq);
    const events = [];
    if (p && p.type !== 'k') {
      const hp = (instance.meta.hp[sq] ?? 2) - 1;
      if (hp <= 0) {
        killPiece(session, sq);
        events.push({ type: 'piece-killed', square: sq });
        delete instance.meta.hp[sq];
      } else {
        instance.meta.hp[sq] = hp;
        events.push({ type: 'acid-tick', square: sq, hp, instanceId: instance.instanceId });
      }
    } else {
      delete instance.meta.hp[sq];
    }
    return events;
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
