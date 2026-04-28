export default {
  onActivate(session, instance) {
    session.extraTurnFor = instance.owner;
    return [{ type: 'extra-turn-granted', color: instance.owner, instanceId: instance.instanceId }];
  },
};
