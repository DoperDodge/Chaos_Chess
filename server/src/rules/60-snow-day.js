// Snow Day: visual marker (movement-range -1 needs custom validation).
export default {
  onActivate(session, instance) {
    return [{ type: 'snow-day', instanceId: instance.instanceId }];
  },
};
