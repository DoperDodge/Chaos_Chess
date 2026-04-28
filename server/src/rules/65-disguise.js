import { ownPieceSquares, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Auto-target: random own piece + random "disguise" type.
export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner).filter(p => p.type !== 'k');
    const target = pickRandom(own);
    if (!target) return [];
    const types = ['p','n','b','r','q'].filter(t => t !== target.type);
    const disguise = types[Math.floor(Math.random() * types.length)];
    instance.meta.square = target.square;
    instance.meta.disguise = disguise;
    addPieceEffect(session, target.square, { type: 'disguise', instanceId: instance.instanceId, owner: instance.owner, displayAs: disguise });
    return [{ type: 'disguise-set', square: target.square, displayAs: disguise, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
