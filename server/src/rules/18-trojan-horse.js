import { ownPieceSquares, placePiece, pickRandom, addPieceEffect, removePieceEffectsByInstance } from './_helpers.js';

// Auto-target: spawn a fake pawn on a random empty back-rank tile.
export default {
  onActivate(session, instance) {
    const backRank = instance.owner === 'white' ? '2' : '7';
    const empties = ['a','b','c','d','e','f','g','h']
      .map(f => `${f}${backRank}`)
      .filter(sq => !session.chess.get(sq));
    const sq = pickRandom(empties);
    if (!sq) return [];
    placePiece(session, sq, 'p', instance.owner);
    instance.meta.square = sq;
    addPieceEffect(session, sq, { type: 'trojan', instanceId: instance.instanceId });
    return [{ type: 'trojan-placed', square: sq, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move || !move.captured) return [];
    if (move.to !== instance.meta.square) return [];
    // Replace captor with our knight
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (typeof session.chess.remove === 'function') session.chess.remove(move.to);
    if (typeof session.chess.put === 'function') session.chess.put({ type: 'n', color: ownerChar }, move.to);
    instance.turnsRemaining = 0;
    return [
      { type: 'piece-killed', square: move.to },
      { type: 'pieces-spawned', squares: [move.to], kind: 'n', color: instance.owner, instanceId: instance.instanceId },
    ];
  },
  onDeactivate(session, instance) { removePieceEffectsByInstance(session, instance.instanceId); return []; },
};
