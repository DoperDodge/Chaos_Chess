// Nightmare: 50% chance opponent's move is ignored each turn. We intercept
// onMoveAttempt for the opponent and randomly block.
export default {
  onActivate(session, instance) {
    instance.meta.targetColor = instance.owner === 'white' ? 'black' : 'white';
    return [{ type: 'nightmare', target: instance.meta.targetColor, instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.color !== instance.meta.targetColor) return [];
    if (Math.random() < 0.5) {
      return [{ type: 'move-blocked', reason: 'nightmare paralysis' }];
    }
    return [];
  },
};
