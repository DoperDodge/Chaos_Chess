export default {
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move || !move.captured) return [];
    // The captured piece was a pawn of the rule owner.
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (move.captured !== 'p') return [];
    // chess.js move record: move.color is the moving color, captured is type. We can't directly tell the captured piece's color, but capturing a pawn of opposite color implies the pawn was opponent's. Owner of the rule loses pawns; the captor is opponent. So the moving piece is the captor — kill it.
    const captorColor = move.color; // 'w' | 'b'
    if (captorColor === ownerChar) return []; // own captured own (shouldn't happen)
    if (typeof session.chess.remove === 'function') session.chess.remove(move.to);
    return [
      { type: 'explosion', center: move.to, radius: 0, instanceId: instance.instanceId },
      { type: 'piece-killed', square: move.to },
    ];
  },
};
