// Confusion: opponent's next move is randomized. Implementation: on next opponent
// move attempt, replace target with a random legal move's destination.
import { Chess } from 'chess.js';

export default {
  onActivate(session, instance) {
    instance.meta.targetColor = instance.owner === 'white' ? 'black' : 'white';
    return [{ type: 'confusion', target: instance.meta.targetColor, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.color !== instance.meta.targetColor) return [];
    if (instance.meta.consumed) return [];
    let chess;
    try { chess = new Chess(session.chess.fen()); } catch (_) { return []; }
    let moves;
    try { moves = chess.moves({ verbose: true }); } catch (_) { return []; }
    if (!moves?.length) return [];
    const random = moves[Math.floor(Math.random() * moves.length)];
    instance.meta.consumed = true;
    instance.turnsRemaining = 0;
    // Apply the random move on the actual session
    try { session.chess.move({ from: random.from, to: random.to, promotion: 'q' }); } catch (_) {}
    return [
      { type: 'confusion-applied', from: random.from, to: random.to, instanceId: instance.instanceId },
      { type: 'move-applied-manually', from: random.from, to: random.to, piece: random.piece },
    ];
  },
};
