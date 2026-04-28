// Knight Errant: visual marker. Allowing a knight to move to ANY tile requires
// a chess-rule override; surface the rule, retire on first knight move.
export default {
  onActivate(session, instance) {
    return [{ type: 'knight-errant', owner: instance.owner, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.piece === 'n') {
      instance.turnsRemaining = 0;
      return [{ type: 'knight-errant-used', instanceId: instance.instanceId }];
    }
    return [];
  },
};
