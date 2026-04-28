// Pacman Board: visual marker only — chess.js doesn't natively support
// wraparound moves, so we surface the active rule but don't override
// movement legality. The active-rules dropdown still tells the player.
export default {
  onActivate(session, instance) {
    return [{ type: 'pacman-board', instanceId: instance.instanceId }];
  },
};
