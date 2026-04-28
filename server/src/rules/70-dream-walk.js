import { ALL_SQUARES, findKingSquare, colorChar, pickRandom } from './_helpers.js';
import { Chess } from 'chess.js';

// Auto-target: teleport the king to a random "safe" empty tile.
export default {
  onActivate(session, instance) {
    const kingSq = findKingSquare(session, instance.owner);
    if (!kingSq) return [];
    const fen = session.chess.fen();
    const safe = ALL_SQUARES.filter(sq => {
      if (session.chess.get(sq)) return false;
      // Check by simulating king on `sq` whether opponent can attack it
      try {
        const test = new Chess(fen);
        if (typeof test.remove === 'function') test.remove(kingSq);
        if (typeof test.put === 'function') test.put({ type: 'k', color: colorChar(instance.owner) }, sq);
        // If now in check, not safe
        return !test.inCheck();
      } catch (_) { return false; }
    });
    const dest = pickRandom(safe);
    if (!dest) return [];
    if (typeof session.chess.remove === 'function') session.chess.remove(kingSq);
    if (typeof session.chess.put === 'function') session.chess.put({ type: 'k', color: colorChar(instance.owner) }, dest);
    instance.turnsRemaining = 0;
    return [{ type: 'dream-walk', from: kingSq, to: dest, instanceId: instance.instanceId }];
  },
};
