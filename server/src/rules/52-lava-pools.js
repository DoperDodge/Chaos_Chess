import { ALL_SQUARES, addTileEffect, pickRandomMany, killPiece, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(sq => !session.chess.get(sq));
    const tiles = pickRandomMany(empties, 3);
    instance.meta.tiles = tiles;
    for (const sq of tiles) addTileEffect(session, sq, { type: 'lava', instanceId: instance.instanceId });
    return [{ type: 'lava-tiles', tiles, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move) return [];
    if (!instance.meta.tiles?.includes(move.to)) return [];
    const p = session.chess.get(move.to);
    if (!p || p.type === 'k') return [];
    killPiece(session, move.to);
    return [{ type: 'piece-killed', square: move.to }, { type: 'lava-burn', square: move.to, instanceId: instance.instanceId }];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
