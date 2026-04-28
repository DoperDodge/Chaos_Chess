// Knight's Curse: visual marker. chess.js validates knight movement intrinsically,
// so we surface the rule but cannot redefine the legal move set without a custom validator.
export default {
  onActivate(session, instance) {
    return [{ type: 'knights-curse', instanceId: instance.instanceId }];
  },
};
