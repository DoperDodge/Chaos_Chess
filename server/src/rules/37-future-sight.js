// Future Sight: visual hint only. Computing opponent's "most likely move" requires
// an evaluator we don't ship. Surface the rule for both players.
export default {
  onActivate(session, instance) {
    return [{ type: 'future-sight', owner: instance.owner, instanceId: instance.instanceId }];
  },
};
