import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const all = [...ownPieceSquares(session, 'white'), ...ownPieceSquares(session, 'black')].filter(p => p.type !== 'k');
    const target = pickRandom(all);
    if (!target) return [];
    instance.meta.square = target.square;
    addPieceEffect(session, target.square, { type: 'frozen', instanceId: instance.instanceId });
    return [{ type: 'piece-frozen', square: target.square, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.from === instance.meta.square || ctx.to === instance.meta.square) {
      return [{ type: 'move-blocked', reason: 'piece is frozen' }];
    }
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
