// Lucky Day: next 3 captures by owner cannot be retaliated against.
// We mark the captor's destination square as untouchable for 1 turn.
export default {
  onActivate(session, instance) {
    instance.meta.uses = 3;
    instance.meta.protected = {}; // sq -> turn first protected
    return [{ type: 'lucky-day', owner: instance.owner, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move || !move.captured) return [];
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (move.color !== ownerChar) return [];
    if (instance.meta.uses <= 0) return [];
    instance.meta.uses -= 1;
    instance.meta.protected[move.to] = session.turnNumber;
    return [{ type: 'lucky-protected', square: move.to, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    const protectedTurn = instance.meta.protected?.[ctx.to];
    if (protectedTurn != null && session.turnNumber - protectedTurn <= 1) {
      return [{ type: 'move-blocked', reason: 'piece is shielded by lucky day' }];
    }
    return [];
  },
};
