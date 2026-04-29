// Backwards Pawns: own pawns can also move 1 tile straight backward onto an empty square.
import { fileIndex, rankIndex, squareFrom, colorChar } from './_helpers.js';

export default {
  onActivate(session, instance) {
    return [{ type: 'backwards-pawns', instanceId: instance.instanceId }];
  },
  extraMoves(session, instance, fromSq) {
    const piece = session.chess.get(fromSq);
    if (!piece || piece.type !== 'p') return [];
    if (piece.color !== colorChar(instance.owner)) return [];
    const dir = instance.owner === 'white' ? -1 : 1;
    const dest = squareFrom(fileIndex(fromSq), rankIndex(fromSq) + dir);
    if (!dest) return [];
    if (session.chess.get(dest)) return [];
    return [{ to: dest, piece: 'p' }];
  },
};
