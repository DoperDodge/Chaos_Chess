// Fast Forward: tick all active rule durations down by 3 instantly.
export default {
  onActivate(session, instance) {
    const events = [{ type: 'fast-forward', instanceId: instance.instanceId }];
    for (const r of session.activeRules) {
      if (r.instanceId === instance.instanceId) continue;
      if (typeof r.turnsRemaining === 'number') {
        r.turnsRemaining = Math.max(0, r.turnsRemaining - 3);
      }
    }
    instance.turnsRemaining = 0;
    return events;
  },
};
