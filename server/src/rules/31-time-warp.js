// Time Warp: undo last 2 moves. We use chess.js undo() which restores captured pieces.
export default {
  onActivate(session, instance) {
    const events = [];
    let undone = 0;
    for (let i = 0; i < 2; i++) {
      try {
        const u = session.chess.undo();
        if (u) undone++;
      } catch (_) { break; }
    }
    instance.turnsRemaining = 0;
    if (undone) events.push({ type: 'time-warp', undone, instanceId: instance.instanceId });
    return events;
  },
};
