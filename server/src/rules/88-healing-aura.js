import { findKingSquare, adjacentSquares } from './_helpers.js';

// Adjacent allies of own king cannot be captured. Block any move that would capture them.
export default {
  onActivate(session, instance) {
    return [{ type: 'healing-aura', owner: instance.owner, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    const kingSq = findKingSquare(session, instance.owner);
    if (!kingSq) return [];
    const protectedSquares = adjacentSquares(kingSq);
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    const target = session.chess.get(ctx.to);
    if (!target) return [];
    if (target.color !== ownerChar) return [];
    if (!protectedSquares.includes(ctx.to)) return [];
    return [{ type: 'move-blocked', reason: 'healing aura protects this piece' }];
  },
};
