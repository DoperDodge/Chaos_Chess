// Aurora: visual buff. Movement-range +1 isn't expressible inside chess.js.
export default {
  onActivate(session, instance) {
    return [{ type: 'aurora', instanceId: instance.instanceId }];
  },
};
