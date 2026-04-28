import { ownPieceSquares, pickRandom, addPieceEffect, findKingSquare, placePiece, killPiece } from './_helpers.js';

// Tag a random own pawn as the heir. If the king dies during this rule's
// duration (which is permanent), promote the heir to a king.
export default {
  onActivate(session, instance) {
    const pawns = ownPieceSquares(session, instance.owner).filter(p => p.type === 'p');
    const heir = pickRandom(pawns);
    if (!heir) return [];
    instance.meta.heirSquare = heir.square;
    addPieceEffect(session, heir.square, { type: 'heir', instanceId: instance.instanceId });
    return [{ type: 'heir-tagged', square: heir.square, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    // Track heir if it moved
    const move = ctx.move;
    if (move?.from === instance.meta.heirSquare) instance.meta.heirSquare = move.to;
    return [];
  },
  onTurnEnd(session, instance) {
    // If owner's king is gone and heir still alive, transform heir into king
    const kingSq = findKingSquare(session, instance.owner);
    if (kingSq) return [];
    const heirSq = instance.meta.heirSquare;
    if (!heirSq) return [];
    const heir = session.chess.get(heirSq);
    if (!heir) return [];
    killPiece(session, heirSq);
    placePiece(session, heirSq, 'k', instance.owner);
    instance.turnsRemaining = 0;
    if (session.gameOver?.reason === 'king-captured') session.gameOver = null;
    return [{ type: 'heir-crowned', square: heirSq, instanceId: instance.instanceId }];
  },
};
