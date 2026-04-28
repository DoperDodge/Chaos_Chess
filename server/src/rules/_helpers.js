// Shared rule helper utilities. These wrap chess.js methods and add chaos-specific helpers.
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const ALL_SQUARES = (() => {
  const out = [];
  for (const r of RANKS) for (const f of FILES) out.push(`${f}${r}`);
  return out;
})();

export function fileIndex(sq) { return FILES.indexOf(sq[0]); }
export function rankIndex(sq) { return RANKS.indexOf(sq[1]); }
export function squareFrom(fi, ri) {
  if (fi < 0 || fi > 7 || ri < 0 || ri > 7) return null;
  return `${FILES[fi]}${RANKS[ri]}`;
}

export function adjacentSquares(sq, includeDiagonals = true) {
  const fi = fileIndex(sq), ri = rankIndex(sq);
  const out = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      if (!includeDiagonals && df !== 0 && dr !== 0) continue;
      const s = squareFrom(fi + df, ri + dr);
      if (s) out.push(s);
    }
  }
  return out;
}

export function ownPieceSquares(session, color) {
  const colorChar = color === 'white' ? 'w' : 'b';
  const out = [];
  for (const sq of ALL_SQUARES) {
    const p = session.chess.get(sq);
    if (p && p.color === colorChar) out.push({ square: sq, type: p.type });
  }
  return out;
}

export function emptySquares(session) {
  return ALL_SQUARES.filter(sq => !session.chess.get(sq));
}

export function emptyOwnHalfSquares(session, color) {
  // White's half = ranks 1-4; Black's half = ranks 5-8.
  const range = color === 'white' ? ['1','2','3','4'] : ['5','6','7','8'];
  return ALL_SQUARES.filter(sq => range.includes(sq[1]) && !session.chess.get(sq));
}

export function pieceAt(session, sq) {
  return session.chess.get(sq);
}

// Removes a piece from the board by square (without using a "move", since chaos can kill arbitrarily).
// Uses chess.js's remove() (or fallback to FEN rewrite).
export function killPiece(session, sq) {
  const p = session.chess.get(sq);
  if (!p) return null;
  // chess.js v1.x: remove(square) returns the removed piece or null
  if (typeof session.chess.remove === 'function') {
    try { session.chess.remove(sq); } catch (_) { fallbackRemove(session, sq); }
  } else {
    fallbackRemove(session, sq);
  }
  session.deadPieces.push({ square: sq, type: p.type, color: p.color, killedAtTurn: session.turnNumber });
  return p;
}

function fallbackRemove(session, sq) {
  // FEN rewrite. Conservative; only used if chess.js doesn't support remove().
  const fen = session.chess.fen();
  const [board, ...rest] = fen.split(' ');
  const ranks = board.split('/');
  const fi = fileIndex(sq);
  const ri = 7 - rankIndex(sq); // FEN starts at rank 8
  const expanded = ranks[ri].split('').flatMap(c => /\d/.test(c) ? Array(Number(c)).fill('1') : [c]);
  expanded[fi] = '1';
  // collapse digits
  let collapsed = '';
  let runs = 0;
  for (const c of expanded) {
    if (c === '1') runs++;
    else { if (runs) { collapsed += runs; runs = 0; } collapsed += c; }
  }
  if (runs) collapsed += runs;
  ranks[ri] = collapsed;
  session.chess.load([ranks.join('/'), ...rest].join(' '));
}

export function placePiece(session, sq, type, color) {
  const colorChar = color === 'white' ? 'w' : 'b';
  if (typeof session.chess.put === 'function') {
    try { return session.chess.put({ type, color: colorChar }, sq); } catch (_) {}
  }
  return false;
}

export function pickRandom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomMany(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

export function addTileEffect(session, sq, effect) {
  if (!session.tileEffects[sq]) session.tileEffects[sq] = [];
  session.tileEffects[sq].push(effect);
}

export function removeTileEffectsByInstance(session, instanceId) {
  for (const sq of Object.keys(session.tileEffects)) {
    session.tileEffects[sq] = session.tileEffects[sq].filter(e => e.instanceId !== instanceId);
    if (!session.tileEffects[sq].length) delete session.tileEffects[sq];
  }
}

export function addPieceEffect(session, sq, effect) {
  if (!session.pieceEffects[sq]) session.pieceEffects[sq] = [];
  session.pieceEffects[sq].push(effect);
}

export function movePieceEffect(session, fromSq, toSq) {
  if (session.pieceEffects[fromSq]) {
    session.pieceEffects[toSq] = (session.pieceEffects[toSq] || []).concat(session.pieceEffects[fromSq]);
    delete session.pieceEffects[fromSq];
  }
}

export function removePieceEffectsByInstance(session, instanceId) {
  for (const sq of Object.keys(session.pieceEffects)) {
    session.pieceEffects[sq] = session.pieceEffects[sq].filter(e => e.instanceId !== instanceId);
    if (!session.pieceEffects[sq].length) delete session.pieceEffects[sq];
  }
}

export function colorChar(color) { return color === 'white' ? 'w' : 'b'; }
