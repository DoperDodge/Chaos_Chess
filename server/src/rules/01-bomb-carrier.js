import { ownPieceSquares, adjacentSquares, killPiece, addPieceEffect, pickRandom, removePieceEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const own = ownPieceSquares(session, instance.owner);
    const target = pickRandom(own);
    if (!target) return [];
    instance.meta.bombSquare = target.square;
    addPieceEffect(session, target.square, { type: 'bomb', instanceId: instance.instanceId, fuse: 5 });
    return [{ type: 'bomb-attached', square: target.square, instanceId: instance.instanceId }];
  },
  onTurnEnd(session, instance) {
    if (instance.turnsRemaining > 1) return [];
    // About to expire: detonate now
    const sq = instance.meta.bombSquare;
    if (!sq) return [];
    const events = [{ type: 'explosion', center: sq, radius: 1, instanceId: instance.instanceId }];
    const targets = [sq, ...adjacentSquares(sq)];
    for (const t of targets) {
      const p = session.chess.get(t);
      if (p) {
        if (p.type === 'k') {
          // King can't be killed by chaos directly; if king blast, set game over
          session.gameOver = { reason: 'bomb', winner: p.color === 'w' ? 'black' : 'white' };
          events.push({ type: 'game-over', ...session.gameOver });
        } else {
          killPiece(session, t);
          events.push({ type: 'piece-killed', square: t });
        }
      }
    }
    removePieceEffectsByInstance(session, instance.instanceId);
    return events;
  },
  onDeactivate(session, instance) {
    removePieceEffectsByInstance(session, instance.instanceId);
    return [];
  },
};
