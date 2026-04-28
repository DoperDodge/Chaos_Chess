// Diagonal Pawns: visual marker. Pawn rules are baked into chess.js validation.
export default {
  onActivate(session, instance) {
    return [{ type: 'diagonal-pawns', instanceId: instance.instanceId }];
  },
};
