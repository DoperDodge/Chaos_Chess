// Royal Guard: king cannot be put in check. Implementation: block any move that would result in check.
// chess.js inherently prevents moving into check; this rule extends to the opponent's perspective: opponent
// cannot make a move that places this owner's king in check. We approximate by disallowing such moves on
// onMoveAttempt for the opponent's color.
export default {
  onMoveAttempt(session, instance, ctx) {
    if (ctx.color === instance.owner) return [];
    // Try the move on a copy
    const fen = session.chess.fen();
    let willCheck = false;
    try {
      const test = new (session.chess.constructor)(fen);
      const m = test.move({ from: ctx.from, to: ctx.to, promotion: 'q' });
      if (m && test.inCheck()) {
        // After the move, who is in check? The side to move next.
        const sideInCheck = test.turn(); // 'w' or 'b' — this is the side that just got the move forced upon them
        const ownerChar = instance.owner === 'white' ? 'w' : 'b';
        if (sideInCheck === ownerChar) willCheck = true;
      }
    } catch (_) {}
    if (willCheck) return [{ type: 'move-blocked', reason: 'royal guard prevents check' }];
    return [];
  },
};
