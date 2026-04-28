// Truce: no captures allowed for 3 turns.
export default {
  onMoveAttempt(session, instance, ctx) {
    const dest = session.chess.get(ctx.to);
    if (dest) return [{ type: 'move-blocked', reason: 'truce: no captures' }];
    return [];
  },
};
