import { ALL_SQUARES, addTileEffect, pickRandomMany, removeTileEffectsByInstance } from './_helpers.js';

export default {
  onActivate(session, instance) {
    const empties = ALL_SQUARES.filter(s => !session.chess.get(s));
    const pair = pickRandomMany(empties, 2);
    if (pair.length < 2) return [];
    instance.meta.a = pair[0];
    instance.meta.b = pair[1];
    addTileEffect(session, pair[0], { type: 'wormhole', instanceId: instance.instanceId, paired: pair[1] });
    addTileEffect(session, pair[1], { type: 'wormhole', instanceId: instance.instanceId, paired: pair[0] });
    return [{ type: 'wormhole-set', tiles: pair, instanceId: instance.instanceId }];
  },
  onMoveEnd(session, instance, ctx) {
    if (!ctx.move) return [];
    let exit = null;
    if (ctx.move.to === instance.meta.a) exit = instance.meta.b;
    else if (ctx.move.to === instance.meta.b) exit = instance.meta.a;
    if (!exit) return [];
    if (session.chess.get(exit)) return [];
    const p = session.chess.get(ctx.move.to);
    if (!p) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(ctx.move.to);
    if (typeof session.chess.put === 'function') session.chess.put(p, exit);
    return [{ type: 'wormhole-traversed', from: ctx.move.to, to: exit, instanceId: instance.instanceId }];
  },
  onDeactivate(session, instance) { removeTileEffectsByInstance(session, instance.instanceId); return []; },
};
