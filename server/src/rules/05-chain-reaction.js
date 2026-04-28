import { adjacentSquares, killPiece, pickRandom } from './_helpers.js';

export default {
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move || !move.captured) return [];
    const adj = adjacentSquares(move.to).filter(sq => {
      const p = session.chess.get(sq);
      return p && p.type !== 'k';
    });
    const target = pickRandom(adj);
    if (!target) return [];
    killPiece(session, target);
    return [
      { type: 'chain-reaction', from: move.to, to: target, instanceId: instance.instanceId },
      { type: 'piece-killed', square: target },
    ];
  },
};
