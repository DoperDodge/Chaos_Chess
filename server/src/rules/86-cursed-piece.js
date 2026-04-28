import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const opponent = instance.owner === 'white' ? 'black' : 'white';
    const own = ownPieceSquares(session, opponent).filter(p => p.type !== 'k');
    const target = pickRandom(own);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'cursed', instanceId: instance.instanceId });
    return [{ type: 'piece-cursed', square: target.square, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.from === instance.meta.square) {
      return [{ type: 'move-blocked', reason: 'piece is cursed' }];
    }
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
