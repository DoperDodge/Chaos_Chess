import { fileIndex, rankIndex, squareFrom, colorChar } from './_helpers.js';

// Backwards Pawns: intercept onMoveAttempt — if the move is a one-tile straight
// step BACKWARD onto an empty square, perform it manually (bypassing chess.js).
export default {
  onActivate(session, instance) {
    return [{ type: 'backwards-pawns', instanceId: instance.instanceId }];
  },
  onMoveAttempt(session, instance, ctx) {
    if (ctx.color !== instance.owner) return [];
    const piece = session.chess.get(ctx.from);
    if (!piece || piece.type !== 'p' || piece.color !== colorChar(instance.owner)) return [];
    const fFrom = fileIndex(ctx.from), rFrom = rankIndex(ctx.from);
    const fTo = fileIndex(ctx.to), rTo = rankIndex(ctx.to);
    if (fFrom !== fTo) return [];
    const dir = instance.owner === 'white' ? -1 : 1; // backward direction
    if (rTo - rFrom !== dir) return [];
    if (session.chess.get(ctx.to)) return [];
    // Manually move
    if (typeof session.chess.remove === 'function') session.chess.remove(ctx.from);
    if (typeof session.chess.put === 'function') session.chess.put(piece, ctx.to);
    // Flip side-to-move so the chess.js engine stays consistent
    const fen = session.chess.fen().split(' ');
    fen[1] = fen[1] === 'w' ? 'b' : 'w';
    fen[3] = '-';
    session.chess.load(fen.join(' '));
    return [{ type: 'move-applied-manually', from: ctx.from, to: ctx.to }];
  },
};
