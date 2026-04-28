// Slippery Floor: visual marker. chess.js movement validation makes "overshoot
// by one" hard to express; we surface the rule and let players see it active.
export default {
  onActivate(session, instance) {
    return [{ type: 'slippery-floor', instanceId: instance.instanceId }];
  },
};
