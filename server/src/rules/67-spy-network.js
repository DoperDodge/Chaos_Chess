// Spy Network: client renders danger zones for the rule's owner.
export default {
  onActivate(session, instance) {
    return [{ type: 'spy-network', owner: instance.owner, instanceId: instance.instanceId }];
  },
};
