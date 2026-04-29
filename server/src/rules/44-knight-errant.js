// Knight Errant: the rule's owner can move any of their knights to any
// empty/enemy tile on the board (one use). After the first knight move,
// the rule retires.
import { ALL_SQUARES, colorChar } from './_helpers.js';

export default {
  onActivate(session, instance) {
    return [{ type: 'knight-errant', owner: instance.owner, instanceId: instance.instanceId }];
  },
  extraMoves(session, instance, fromSq) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'n') return [];
    if (piece.color !== colorChar(instance.owner)) return [];
    const out = [];
    for (const to of ALL_SQUARES) {
      if (to === fromSq) continue;
      const t = session.chess.get(to);
      if (t && t.color === piece.color) continue;
      if (t && t.type === 'k') continue;
      out.push({ to, piece: 'n', captured: t?.type });
    }
    return out;
  },
  onMoveEnd(session, instance, ctx) {
    if (ctx.move?.piece === 'n') {
      instance.turnsRemaining = 0;
      return [{ type: 'knight-errant-used', instanceId: instance.instanceId }];
    }
    return [];
  },
};
