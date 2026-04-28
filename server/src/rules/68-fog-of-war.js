// Visual rule. Client renders fog except adjacent to own pieces.
export default {
  onActivate(session, instance) {
    return [{ type: 'fog-of-war', instanceId: instance.instanceId }];
  },
};
