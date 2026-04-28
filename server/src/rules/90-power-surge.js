// Visual buff. Mechanical effect (extra range) is hard to express through chess.js validation
// without a custom validator. For now, present it as a visual buff that grants Speed Demon-like
// brief queen movement to one piece per turn.
import { ownPieceSquares, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    for (const p of ownPieceSquares(session, instance.owner)) {
      addPieceEffect(session, p.square, { type: 'power-surge', instanceId: instance.instanceId });
    }
    return [{ type: 'power-surge', color: instance.owner, instanceId: instance.instanceId }];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
