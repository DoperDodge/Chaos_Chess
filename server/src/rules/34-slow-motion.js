// Slow Motion: visual marker. Constraining opponent piece movement to 1 tile
// requires a custom move validator beyond chess.js's. Surface the rule.
export default {
  onActivate(session, instance) {
    return [{ type: 'slow-motion', target: instance.owner === 'white' ? 'black' : 'white', instanceId: instance.instanceId }];
  },
};
