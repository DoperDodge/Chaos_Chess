import { emptyOwnHalfSquares, placePiece, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Auto-target: random piece type from {p,n,b,r,q}, random empty tile in own half.
export default {
  onActivate(session, instance) {
    const types = ['p','n','b','r','q'];
    const type = types[Math.floor(Math.random() * types.length)];
    const sq = pickRandom(emptyOwnHalfSquares(session, instance.owner));
    if (!sq) return [];
    placePiece(session, sq, type, instance.owner);
    instance.meta.square = sq;
    addPieceEffect(session, sq, { type: 'mercenary', instanceId: instance.instanceId });
    return [{ type: 'pieces-spawned', squares: [sq], kind: type, color: instance.owner, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.from === instance.meta.square) instance.meta.square = ctx.move.to;
    return [];
  },
  onDeactivate(session, instance) {
    const sq = instance.meta.square;
    const events = [];
    if (sq && session.chess.get(sq)) {
      if (typeof session.chess.remove === 'function') session.chess.remove(sq);
      events.push({ type: 'piece-killed', square: sq });
    }
    removePieceEffectsByInstance(session, instance.instanceId);
    return events;
  },
};
