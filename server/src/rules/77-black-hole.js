import { ALL_SQUARES, adjacentSquares, addTileEffect, killPiece, pickRandom, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(s => !session.chess.get(s));
    const sq = pickRandom(empties);
    if (!sq) return [];
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'black-hole', instanceId: instance.instanceId });
    return [{ type: 'black-hole-opened', square: sq, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (!ctx.move) return [];
    const tile = instance.meta.tile;
    const danger = [tile, ...adjacentSquares(tile)];
    if (!danger.includes(ctx.move.to)) return [];
    const p = session.chess.get(ctx.move.to);
    if (!p || p.type === 'k') return [];
    killPiece(session, ctx.move.to);
    return [{ type: 'black-hole-devour', square: ctx.move.to, instanceId: instance.instanceId }, { type: 'piece-killed', square: ctx.move.to }];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
