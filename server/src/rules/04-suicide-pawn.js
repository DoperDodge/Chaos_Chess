import { ownPieceSquares, addPieceEffect, pickRandom } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const pawns = ownPieceSquares(session, instance.owner).filter(p => p.type === 'p');
    const target = pickRandom(pawns);
    if (!target) return [];
    instance.meta.pawnSquare = target.square;
    addPieceEffect(session, target.square, { type: 'suicide-pawn', instanceId: instance.instanceId, owner: instance.owner });
    return [{ type: 'suicide-pawn-set', square: target.square, instanceId: instance.instanceId }];
  },
  // Capture detection happens via onMoveEnd inspecting last move.
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move || !move.captured) return [];
    if (move.to !== instance.meta.pawnSquare) return [];
    // The pawn was captured; kill the captor and the pawn (already removed by chess.js capture).
    const events = [{ type: 'explosion', center: move.to, radius: 0, instanceId: instance.instanceId }];
    // Remove the captor too
    if (typeof session.chess.remove === 'function') session.chess.remove(move.to);
    events.push({ type: 'piece-killed', square: move.to });
    instance.meta.triggered = true;
    instance.turnsRemaining = 0;
    return events;
  },
};
