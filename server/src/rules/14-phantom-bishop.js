import { ALL_SQUARES, placePiece, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Phantom Bishop appears on owner's back rank; cannot capture (we mark it,
// chess.js still applies its movement). Spook effect is simulated by curse
// marker on adjacent enemy pieces.
export default {
  onActivate(session, instance) {
    const backRank = instance.owner === 'white' ? '1' : '8';
    const empties = ['a','b','c','d','e','f','g','h']
      .map(f => `${f}${backRank}`)
      .filter(sq => !session.chess.get(sq));
    const sq = pickRandom(empties);
    if (!sq) return [];
    placePiece(session, sq, 'b', instance.owner);
    instance.meta.square = sq;
    addPieceEffect(session, sq, { type: 'phantom', instanceId: instance.instanceId });
    return [{ type: 'pieces-spawned', squares: [sq], kind: 'b', color: instance.owner, instanceId: instance.instanceId }];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
