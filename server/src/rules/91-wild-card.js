import { RULES } from '@chaotic-chess/shared/rules';

export default {
  onActivate(session, instance) {
    const events = [];
    const activeIds = new Set(session.activeRules.map(r => r.ruleId));
    const candidates = RULES.filter(r => !activeIds.has(r.id) && r.id !== 91);
    if (!candidates.length) return events;
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    events.push({ type: 'wild-card-rolled', ruleId: choice.id, name: choice.name });
    const result = session.engine.activate(choice.id, instance.owner, { fromWildCard: instance.instanceId });
    if (result?.events) events.push(...result.events);
    // Wild Card itself only persists 1 turn; the inner rule keeps its own duration.
    return events;
  },
};
