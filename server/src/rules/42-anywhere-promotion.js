// Anywhere Promotion: visual marker. chess.js promotion only triggers on rank 8/1,
// so this is a known partial implementation.
export default {
  onActivate(session, instance) {
    return [{ type: 'anywhere-promotion', owner: instance.owner, instanceId: instance.instanceId }];
  },
};
