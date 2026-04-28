import { RULES, getRuleById } from '@chaotic-chess/shared/rules';
import { ruleImplementations } from '../rules/index.js';

let nextInstanceId = 1;

export class RuleEngine {
  constructor(session) {
    this.session = session;
  }

  // Pick `count` random rule ids that are eligible: not banned, not currently active.
  generateOfferings(count = 3) {
    const activeIds = new Set(this.session.activeRules.map(r => r.ruleId));
    const banned = this.session.banlist;
    const allowedCategories = new Set(this.session.settings.ruleCategoryFilter || []);
    const pool = RULES.filter(r => {
      if (activeIds.has(r.id)) return false;
      if (banned.has(r.id)) return false;
      if (allowedCategories.size && !allowedCategories.has(r.category)) return false;
      return true;
    });
    if (pool.length === 0) return [];
    // shuffle and take `count`
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(r => r.id);
  }

  activate(ruleId, owner, meta = {}) {
    const rule = getRuleById(ruleId);
    if (!rule) return { ok: false, error: 'unknown rule' };

    const cap = this.session.settings.activeRuleCap;
    if (cap && cap > 0 && this.session.activeRules.length >= cap) {
      // caller must request retirement; we still allow but flag
    }

    const instance = {
      instanceId: nextInstanceId++,
      ruleId,
      owner,                                  // 'white' | 'black'
      activatedAt: this.session.turnNumber,
      turnsRemaining: typeof rule.duration === 'number' ? rule.duration : null,
      durationKind: typeof rule.duration === 'number' ? 'turns' : rule.duration, // 'permanent' | 'triggered' | 'turns'
      meta,
    };
    this.session.activeRules.push(instance);

    const events = [{ type: 'rule-activated', rule: { ...instance, name: rule.name, category: rule.category } }];
    const impl = ruleImplementations[ruleId];
    if (impl?.onActivate) {
      const out = impl.onActivate(this.session, instance);
      if (Array.isArray(out)) events.push(...out);
    }
    return { ok: true, instance, events };
  }

  retire(instanceId, reason = 'expired') {
    const idx = this.session.activeRules.findIndex(r => r.instanceId === instanceId);
    if (idx < 0) return [];
    const instance = this.session.activeRules[idx];
    const events = [];
    const impl = ruleImplementations[instance.ruleId];
    if (impl?.onDeactivate) {
      const out = impl.onDeactivate(this.session, instance, reason);
      if (Array.isArray(out)) events.push(...out);
    }
    this.session.activeRules.splice(idx, 1);
    events.push({ type: 'rule-expired', instanceId, ruleId: instance.ruleId, reason });
    return events;
  }

  runHook(hook, ctx) {
    const events = [];
    // Iterate by reverse activation order so most recent rule's effects take precedence.
    const instances = [...this.session.activeRules].reverse();
    for (const inst of instances) {
      const impl = ruleImplementations[inst.ruleId];
      if (impl?.[hook]) {
        try {
          const out = impl[hook](this.session, inst, ctx);
          if (Array.isArray(out)) events.push(...out);
        } catch (e) {
          console.error(`Rule ${inst.ruleId} hook ${hook} threw:`, e);
        }
      }
    }
    return events;
  }

  tickDurations(turnNumber) {
    const events = [];
    const expired = [];
    for (const inst of this.session.activeRules) {
      if (inst.durationKind === 'turns' && inst.turnsRemaining != null) {
        inst.turnsRemaining -= 1;
        if (inst.turnsRemaining <= 0) expired.push(inst.instanceId);
      }
    }
    for (const id of expired) {
      events.push(...this.retire(id, 'expired'));
    }
    return events;
  }
}
