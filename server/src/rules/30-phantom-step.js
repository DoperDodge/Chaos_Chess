// Phantom Step: your next moved piece this turn moves twice. We grant the picker an extra ply.
export default {
  onActivate(session, instance) {
    session.extraTurnFor = instance.owner;
    return [{ type: 'extra-turn-granted', color: instance.owner, instanceId: instance.instanceId }];
  },
};
