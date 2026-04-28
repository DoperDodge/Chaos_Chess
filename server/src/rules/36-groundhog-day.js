// Groundhog Day: undo the previous turn (2 plies) — the picker may then play differently.
export default {
  onActivate(session, instance) {
    const events = [];
    for (let i = 0; i < 2; i++) {
      try { session.chess.undo(); } catch (_) {}
    }
    events.push({ type: 'groundhog-day', instanceId: instance.instanceId });
    instance.turnsRemaining = 0;
    return events;
  },
};
