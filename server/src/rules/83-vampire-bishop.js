// Vampire Bishop: every capture by owner's bishops grants an extra turn.
export default {
  onActivate(session, instance) {
    return [{ type: 'vampire-bishop', owner: instance.owner, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move) return [];
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (move.color !== ownerChar) return [];
    if (move.piece !== 'b') return [];
    if (!move.captured) return [];
    session.extraTurnFor = instance.owner;
    return [{ type: 'vampire-feed', square: move.to, instanceId: instance.instanceId }];
  },
};
