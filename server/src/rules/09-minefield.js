import { addTileEffect, pickRandomMany, killPiece, removeTileEffectsByInstance } from './_helpers.js';

const CENTER_TILES = ['c3','d3','e3','f3','c4','d4','e4','f4','c5','d5','e5','f5','c6','d6','e6','f6'];

export default {
  onActivate(session, instance) {
    const tiles = pickRandomMany(CENTER_TILES.filter(sq => !session.chess.get(sq)), 4);
    instance.meta.tiles = tiles;
    for (const sq of tiles) addTileEffect(session, sq, { type: 'mine', instanceId: instance.instanceId, owner: instance.owner });
    return [{ type: 'mines-placed', tiles, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    const move = ctx.move;
    if (!move) return [];
    if (!instance.meta.tiles?.includes(move.to)) return [];
    // Trigger only if the moving piece is opponent
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (move.color === ownerChar) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(move.to);
    instance.meta.tiles = instance.meta.tiles.filter(t => t !== move.to);
    return [
      { type: 'explosion', center: move.to, radius: 0, instanceId: instance.instanceId },
      { type: 'piece-killed', square: move.to },
    ];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
