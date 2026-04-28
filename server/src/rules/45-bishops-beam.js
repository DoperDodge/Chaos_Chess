import { fileIndex, rankIndex, squareFrom, killPiece } from './_helpers.js';

// On any bishop capture, also kill every other piece along the diagonal traveled.
export default {
  onActivate(session, instance) {
    return [{ type: 'bishops-beam', owner: instance.owner, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move || move.piece !== 'b') return [];
    if (move.color !== (instance.owner === 'white' ? 'w' : 'b')) return [];
    if (!move.captured) return [];
    const events = [];
    const fFrom = fileIndex(move.from), rFrom = rankIndex(move.from);
    const fTo = fileIndex(move.to), rTo = rankIndex(move.to);
    const dx = Math.sign(fTo - fFrom), dy = Math.sign(rTo - rFrom);
    if (dx === 0 || dy === 0) return [];
    let f = fTo + dx, r = rTo + dy;
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const sq = squareFrom(f, r);
      const p = session.chess.get(sq);
      if (p && p.type !== 'k') {
        killPiece(session, sq);
        events.push({ type: 'piece-killed', square: sq });
      }
      f += dx; r += dy;
    }
    return events;
  },
};
