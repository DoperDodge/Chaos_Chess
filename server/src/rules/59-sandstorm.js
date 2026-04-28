// Pure visual on the client; server flags the rule and the client hides opponent pieces from the rule's opponent.
export default {
  onActivate(session, instance) {
    return [{ type: 'sandstorm', target: instance.owner === 'white' ? 'white' : 'black', instanceId: instance.instanceId }];
  },
};
