export default {
  onActivate(session, instance) {
    const heads = Math.random() < 0.5;
    const beneficiary = heads ? instance.owner : (instance.owner === 'white' ? 'black' : 'white');
    session.extraTurnFor = beneficiary;
    return [{ type: 'coin-flip', result: heads ? 'heads' : 'tails', extraTurnFor: beneficiary, instanceId: instance.instanceId }];
  },
};
