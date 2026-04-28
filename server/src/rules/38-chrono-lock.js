import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Auto-target: random own non-king piece.
export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const target = pickRandom(own);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'chrono-lock', instanceId: instance.instanceId });
    return [{ type: 'piece-locked', square: target.square, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.from === instance.meta.square || ctx.to === instance.meta.square) {
      return [{ type: 'move-blocked', reason: 'piece is chrono-locked' }];
    }
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
