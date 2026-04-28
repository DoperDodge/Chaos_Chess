export default {
  onActivate(session, instance) {
    const opponent = instance.owner === 'white' ? 'black' : 'white';
    session.skipNextTurnFor = opponent;
    return [{ type: 'skip-turn', color: opponent, instanceId: instance.instanceId }];
  },
};
