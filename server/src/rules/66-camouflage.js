// Camouflage: visual rule on the client. Server flags it for the opponent's view.
export default {
  onActivate(session, instance) {
    return [{ type: 'camouflage', owner: instance.owner, instanceId: instance.instanceId }];
  },
};
