import { addTileEffect, pickRandom, removeTileEffectsByInstance, placePiece, ALL_SQUARES } from './_helpers.js';

// Holy Ground: when first own piece steps on the tile, resurrect the most-recently
// lost own piece on an adjacent square (or the holy tile itself if free after move).
export default {
  onActivate(session, instance) {
    const range = instance.owner === 'white' ? ['1','2','3','4'] : ['5','6','7','8'];
    const candidates = ALL_SQUARES.filter(sq => range.includes(sq[1]) && !session.chess.get(sq));
    const sq = pickRandom(candidates);
    if (!sq) return [];
    instance.meta.tile = sq;
    addTileEffect(session, sq, { type: 'holy-ground', instanceId: instance.instanceId, owner: instance.owner });
    return [{ type: 'holy-ground-set', square: sq, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (instance.meta.used) return [];
    if (!ctx.move || ctx.move.to !== instance.meta.tile) return [];
    const ownerChar = instance.owner === 'white' ? 'w' : 'b';
    if (ctx.move.color !== ownerChar) return [];
    // Resurrect most recent own dead piece (not king)
    const dead = (session.deadPieces || []).filter(d => d.color === ownerChar && d.type !== 'k');
    if (!dead.length) return [];
    const last = dead[dead.length - 1];
    // Place on the holy tile (since the piece that stepped there moved off / occupies it).
    // Find an empty adjacent
    const adj = ['a','b','c','d','e','f','g','h'].flatMap(f => ['1','2','3','4','5','6','7','8'].map(r => `${f}${r}`));
    const empty = adj.find(s => !session.chess.get(s));
    if (!empty) return [];
    placePiece(session, empty, last.type, instance.owner);
    instance.meta.used = true;
    instance.turnsRemaining = 0;
    // Remove from deadPieces
    session.deadPieces = (session.deadPieces || []).filter(d => d !== last);
    return [{ type: 'holy-resurrect', square: empty, kind: last.type, instanceId: instance.instanceId }];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
