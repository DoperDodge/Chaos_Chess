// Cancel one currently active rule of your choice. The picker selects via a follow-up
// 'rule-target' interaction. For simplicity in v1, cancel a random other rule (not Reset Button itself).
export default {
  onActivate(session, instance) {
    const candidates = session.activeRules.filter(r => r.instanceId !== instance.instanceId);
    if (!candidates.length) return [];
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const evs = session.engine.retire(target.instanceId, 'reset-button');
    instance.turnsRemaining = 0;
    return [{ type: 'rule-cancelled', instanceId: target.instanceId, by: instance.instanceId }, ...evs];
  },
};
