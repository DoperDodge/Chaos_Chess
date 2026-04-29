import Phaser from 'phaser';
import { Chess } from 'chess.js';

const TILE = 80;            // 8 * 80 = 640
const ORIGIN_X = 40;
const ORIGIN_Y = 40;
const BOARD_PX = TILE * 8;  // 640
const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

// Chess.com-style "Green" theme.
const LIGHT = 0xeeeed2;
const DARK  = 0x769656;
const SELECTED = 0xf6f669;       // yellow tint for selected square
const LAST_MOVE = 0xf6f669;       // yellow tint for last move
const MOVE_DOT = 0x000000;        // semi-transparent black for legal move markers
const MOVE_DOT_ALPHA = 0.18;

// Filled chess glyphs render the same shape regardless of color; we paint
// black with dark fill + light outline and white with light fill + dark outline.
const PIECE_GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const LABEL_COLOR = '#b0b0c8';

export class BoardScene extends Phaser.Scene {
  constructor() {
    super('BoardScene');
    this.tileSprites = {};
    this.pieceSprites = {};
    this.tileEffectSprites = {};
    this.pieceEffectSprites = {};
    this.fromSquare = null;
    this.lastMoveHighlights = [];
    this.moveMarkers = [];        // legal-move dots/rings for the selected piece
    this.state = null;
    this.myColor = 'white';
    this.created = false;
  }

  init(data) {
    this.shared = data?.shared;
    this.hooks = this.shared?.hooks || data?.hooks || {};
    if (this.shared?.myColor) this.myColor = this.shared.myColor;
  }

  create() {
    if (this.shared?.myColor) this.myColor = this.shared.myColor;

    this.cameras.main.setBackgroundColor(0x0d0a1f);

    // Subtle frame around the board
    this.add.rectangle(
      ORIGIN_X + BOARD_PX / 2,
      ORIGIN_Y + BOARD_PX / 2,
      BOARD_PX + 12,
      BOARD_PX + 12,
      0x1f1f1f
    ).setStrokeStyle(2, 0x2c2c2c);

    // Tiles
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const sq = `${FILES[f]}${RANKS[r]}`;
        const x = squareX(sq, this.myColor);
        const y = squareY(sq, this.myColor);
        const dark = (f + r) % 2 === 0;
        const rect = this.add.rectangle(x, y, TILE, TILE, dark ? DARK : LIGHT)
          .setInteractive()
          .setData('sq', sq);
        rect.on('pointerdown', () => this.handleClick(sq));
        this.tileSprites[sq] = rect;
      }
    }

    // File labels below the board
    for (let col = 0; col < 8; col++) {
      const file = this.myColor === 'black' ? FILES[7 - col] : FILES[col];
      this.add.text(
        ORIGIN_X + col * TILE + TILE / 2,
        ORIGIN_Y + BOARD_PX + 18,
        file.toUpperCase(),
        { fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: LABEL_COLOR }
      ).setOrigin(0.5);
    }
    // Rank labels left of the board
    for (let row = 0; row < 8; row++) {
      const rank = this.myColor === 'black' ? RANKS[row] : RANKS[7 - row];
      this.add.text(
        ORIGIN_X - 18,
        ORIGIN_Y + row * TILE + TILE / 2,
        rank,
        { fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: LABEL_COLOR }
      ).setOrigin(0.5);
    }

    this.created = true;

    if (this.shared?.state) {
      this.applyState(this.shared.state, this.shared.myColor);
    }
    if (this.shared?.pendingEvents?.length) {
      this.playEvents(this.shared.pendingEvents);
      this.shared.pendingEvents.length = 0;
    }
  }

  handleClick(sq) {
    if (!this.state || this.state.gameOver) return;
    if (this.state.currentColor !== this.myColor) return;
    const piece = parseFEN(this.state.fen)[sq];
    if (this.fromSquare) {
      if (sq === this.fromSquare) { this.clearSelection(); return; }
      this.hooks.onMoveIntent?.(this.fromSquare, sq);
      this.clearSelection();
    } else if (piece && piece.color === (this.myColor === 'white' ? 'w' : 'b')) {
      this.fromSquare = sq;
      this.tintTile(sq, SELECTED, 0.55);
      this.showLegalMovesFrom(sq);
    }
  }

  clearSelection() {
    if (this.fromSquare) {
      this.restoreTile(this.fromSquare);
      this.fromSquare = null;
    }
    this.clearMoveMarkers();
  }

  tintTile(sq, color, alpha = 0.5) {
    const tile = this.tileSprites[sq];
    if (!tile) return;
    // Apply by changing fill color to a blend; we use a yellow tint by
    // overlaying a translucent rect on top, since changing fillStyle would
    // lose the original square color when restored.
    const x = squareX(sq, this.myColor);
    const y = squareY(sq, this.myColor);
    const overlay = this.add.rectangle(x, y, TILE, TILE, color, alpha).setDepth(1);
    tile.setData('overlay', overlay);
  }

  restoreTile(sq) {
    const tile = this.tileSprites[sq];
    if (!tile) return;
    const overlay = tile.getData('overlay');
    if (overlay) { overlay.destroy(); tile.setData('overlay', null); }
  }

  showLegalMovesFrom(fromSq) {
    this.clearMoveMarkers();
    if (!this.state?.fen) return;
    let chess;
    try {
      chess = new Chess(this.state.fen);
    } catch (_) { return; }
    let moves;
    try { moves = chess.moves({ square: fromSq, verbose: true }); }
    catch (_) { return; }
    const board = parseFEN(this.state.fen);
    for (const mv of moves || []) {
      const x = squareX(mv.to, this.myColor);
      const y = squareY(mv.to, this.myColor);
      const targetPiece = board[mv.to];
      if (targetPiece || mv.flags?.includes('e')) {
        // Capturable: ring around the target square
        const ring = this.add.circle(x, y, TILE / 2 - 2, 0x000000, 0)
          .setStrokeStyle(5, 0x000000, MOVE_DOT_ALPHA + 0.1)
          .setDepth(2);
        this.moveMarkers.push(ring);
      } else {
        // Empty: small dot in center
        const dot = this.add.circle(x, y, TILE * 0.14, MOVE_DOT, MOVE_DOT_ALPHA).setDepth(2);
        this.moveMarkers.push(dot);
      }
    }
  }

  clearMoveMarkers() {
    for (const m of this.moveMarkers) m.destroy();
    this.moveMarkers = [];
  }

  applyState(state, myColor) {
    this.state = state;
    if (myColor) this.myColor = myColor;
    if (!this.created) return;
    // If the selected piece moved or was captured, drop the selection.
    if (this.fromSquare && !parseFEN(state.fen)[this.fromSquare]) {
      this.clearSelection();
    }
    this.renderPieces();
    this.renderTileEffects();
    this.renderPieceEffects();
    this.renderLastMoveHighlight();
  }

  renderPieces() {
    if (!this.state) return;
    const board = parseFEN(this.state.fen);
    for (const sq of Object.keys(this.pieceSprites)) {
      if (!board[sq]) {
        this.pieceSprites[sq].destroy();
        delete this.pieceSprites[sq];
      }
    }
    for (const sq of Object.keys(board)) {
      const p = board[sq];
      const glyph = PIECE_GLYPH[p.type];
      const x = squareX(sq, this.myColor);
      const y = squareY(sq, this.myColor);
      const fill = p.color === 'w' ? '#f8f8f8' : '#1f1f1f';
      const outline = p.color === 'w' ? '#1f1f1f' : '#f8f8f8';
      let sprite = this.pieceSprites[sq];
      if (!sprite) {
        sprite = this.add.text(x, y, glyph, {
          fontFamily: '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", serif',
          fontSize: '70px',
          color: fill,
          stroke: outline,
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(10);
        this.pieceSprites[sq] = sprite;
      } else {
        sprite.setText(glyph);
        sprite.setColor(fill);
        sprite.setStroke(outline, 3);
        this.tweens.add({ targets: sprite, x, y, duration: 200, ease: 'Cubic.easeOut' });
      }
      sprite.setPosition(x, y);
    }
  }

  renderTileEffects() {
    for (const sq of Object.keys(this.tileEffectSprites)) {
      this.tileEffectSprites[sq].forEach(s => s.destroy());
    }
    this.tileEffectSprites = {};
    const effects = this.state?.tileEffects || {};
    for (const sq of Object.keys(effects)) {
      for (const e of effects[sq]) {
        const sprites = this.drawTileEffect(sq, e);
        if (!this.tileEffectSprites[sq]) this.tileEffectSprites[sq] = [];
        this.tileEffectSprites[sq].push(...sprites);
      }
    }
  }

  drawTileEffect(sq, effect) {
    const x = squareX(sq, this.myColor);
    const y = squareY(sq, this.myColor);
    switch (effect.type) {
      case 'lava': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0xff5e3a, 0.85).setDepth(2);
        const glyph = this.add.text(x, y, '🔥', { fontSize: '34px' }).setOrigin(0.5).setDepth(3);
        this.tweens.add({ targets: r, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: glyph, scale: 1.15, duration: 700, yoyo: true, repeat: -1 });
        return [r, glyph];
      }
      case 'mine': {
        // Subtly hint at a hidden mine — only a tiny dot, since the rule is "invisible".
        const r = this.add.circle(x, y, 5, 0x66cc66, 0.5).setDepth(2);
        this.tweens.add({ targets: r, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'cluster-marker': {
        const r = this.add.text(x, y, 'X', { fontFamily: '"Press Start 2P", monospace', fontSize: '28px', color: '#ff3030' })
          .setOrigin(0.5).setDepth(2);
        this.tweens.add({ targets: r, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'doomsday': {
        const r = this.add.rectangle(x, y, TILE - 6, TILE - 6, 0x9933ff, 0.45).setDepth(2);
        const ring = this.add.circle(x, y, TILE / 2 - 6, 0xffd84d, 0).setStrokeStyle(2, 0xffd84d, 0.6).setDepth(2);
        this.tweens.add({ targets: r, alpha: 0.85, duration: 500, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: ring, scale: 1.1, duration: 800, yoyo: true, repeat: -1 });
        return [r, ring];
      }
      case 'volcano-warning':
      case 'spike-warning': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0xff3030, 0.5).setDepth(2);
        this.tweens.add({ targets: r, alpha: 0.15, duration: 350, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'wall': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x4a3a78, 1).setStrokeStyle(2, 0xffd84d).setDepth(5);
        const txt = this.add.text(x, y, '▦', { fontFamily: 'serif', fontSize: '36px', color: '#ffd84d' }).setOrigin(0.5).setDepth(5);
        return [r, txt];
      }
      case 'dragon-egg': {
        const r = this.add.rectangle(x, y, TILE - 8, TILE - 8, 0x7cff7a, 0.3).setDepth(2);
        const egg = this.add.text(x, y, '🥚', { fontSize: '40px' }).setOrigin(0.5).setDepth(3);
        this.tweens.add({ targets: egg, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: r, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
        return [r, egg];
      }
      case 'pit': {
        // The placer can see a faint dotted shadow.
        const r = this.add.circle(x, y, TILE / 2 - 8, 0x000000, 0.18).setStrokeStyle(1, 0x222222, 0.5).setDepth(2);
        return [r];
      }
      case 'tripwire': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0xff3030, 0.12).setDepth(2);
        const line = this.add.rectangle(x, y, TILE - 4, 2, 0xff3030, 0.5).setDepth(3);
        this.tweens.add({ targets: line, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
        return [r, line];
      }
      case 'tar': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x222222, 0.85).setDepth(2);
        const bubble1 = this.add.circle(x - 12, y + 6, 5, 0x000000, 0.7).setDepth(3);
        const bubble2 = this.add.circle(x + 10, y - 8, 4, 0x000000, 0.7).setDepth(3);
        this.tweens.add({ targets: bubble1, y: y - 4, duration: 700, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: bubble2, y: y + 4, duration: 900, yoyo: true, repeat: -1 });
        return [r, bubble1, bubble2];
      }
      case 'magnet': {
        const r = this.add.circle(x, y, TILE / 2 - 4, 0x7cd1ff, 0.0).setStrokeStyle(3, 0x7cd1ff, 0.7).setDepth(2);
        const inner = this.add.circle(x, y, TILE / 4, 0x7cd1ff, 0.0).setStrokeStyle(2, 0x7cd1ff, 0.7).setDepth(2);
        this.tweens.add({ targets: r, scale: 0.9, duration: 700, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: inner, scale: 1.4, alpha: 0, duration: 1000, repeat: -1 });
        return [r, inner];
      }
      case 'black-hole': {
        const r = this.add.circle(x, y, TILE / 2 - 2, 0x000000, 0.95).setDepth(3);
        const ring = this.add.circle(x, y, TILE / 2 - 2, 0x9933ff, 0).setStrokeStyle(3, 0x9933ff, 0.8).setDepth(3);
        this.tweens.add({ targets: ring, scale: 1.1, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
        return [r, ring];
      }
      case 'wormhole': {
        const r = this.add.circle(x, y, TILE / 2 - 6, 0x9933ff, 0.5).setDepth(2);
        const ring = this.add.circle(x, y, TILE / 2 - 6, 0xff5edb, 0).setStrokeStyle(3, 0xff5edb, 0.7).setDepth(3);
        this.tweens.add({ targets: r, angle: 360, duration: 2000, repeat: -1 });
        this.tweens.add({ targets: ring, scale: 1.2, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
        return [r, ring];
      }
      case 'acid': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x7cff7a, 0.7).setDepth(2);
        const drip = this.add.text(x, y, '🧪', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
        this.tweens.add({ targets: r, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: drip, y: y + 4, duration: 700, yoyo: true, repeat: -1 });
        return [r, drip];
      }
      case 'cursed-square': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x9933ff, 0.4).setDepth(2);
        const rune = this.add.text(x, y, '⛧', { fontFamily: 'serif', fontSize: '36px', color: '#dd99ff' }).setOrigin(0.5).setDepth(3);
        this.tweens.add({ targets: rune, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
        return [r, rune];
      }
      case 'holy-ground': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0xffffff, 0.5).setDepth(2);
        const ring = this.add.circle(x, y, TILE / 2 - 6, 0xffd84d, 0).setStrokeStyle(2, 0xffd84d, 0.8).setDepth(3);
        this.tweens.add({ targets: r, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: ring, scale: 1.15, alpha: 0.3, duration: 1000, yoyo: true, repeat: -1 });
        return [r, ring];
      }
      case 'pause-tile': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x7cd1ff, 0.45).setStrokeStyle(2, 0xffffff, 0.6).setDepth(5);
        const icon = this.add.text(x, y, '⏸', { fontFamily: 'serif', fontSize: '36px', color: '#ffffff' }).setOrigin(0.5).setDepth(5);
        return [r, icon];
      }
      case 'quicksand': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0xc8a85a, 0.7).setDepth(2);
        const swirl = this.add.text(x, y, '🌀', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
        this.tweens.add({ targets: swirl, angle: 360, duration: 2500, repeat: -1 });
        return [r, swirl];
      }
      default:
        return [];
    }
  }

  renderPieceEffects() {
    for (const sq of Object.keys(this.pieceEffectSprites)) {
      this.pieceEffectSprites[sq].forEach(s => s.destroy());
    }
    this.pieceEffectSprites = {};
    const effects = this.state?.pieceEffects || {};
    for (const sq of Object.keys(effects)) {
      for (const e of effects[sq]) {
        const sprites = this.drawPieceEffect(sq, e);
        if (!this.pieceEffectSprites[sq]) this.pieceEffectSprites[sq] = [];
        this.pieceEffectSprites[sq].push(...sprites);
      }
    }
  }

  drawPieceEffect(sq, effect) {
    const x = squareX(sq, this.myColor);
    const y = squareY(sq, this.myColor);
    const cornerX = x + TILE / 3;
    const cornerY = y - TILE / 3;
    switch (effect.type) {
      case 'bomb': {
        const t = this.add.text(cornerX, cornerY, '💣', { fontSize: '22px' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: t, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });
        return [t];
      }
      case 'frozen': {
        const ring = this.add.circle(x, y, TILE / 2 - 4, 0x7cd1ff, 0.18).setStrokeStyle(2, 0x7cd1ff, 0.7).setDepth(11);
        const t = this.add.text(cornerX, cornerY, '❄', { fontSize: '22px', color: '#7cd1ff' }).setOrigin(0.5).setDepth(15);
        return [ring, t];
      }
      case 'cursed': {
        const ring = this.add.circle(x, y, TILE / 2 - 4, 0x9933ff, 0.0).setStrokeStyle(2, 0x9933ff, 0.7).setDepth(11);
        const t = this.add.text(cornerX, cornerY, '☠', { fontSize: '22px', color: '#9933ff' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: ring, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });
        return [ring, t];
      }
      case 'speed-demon':
      case 'berserker':
      case 'power-surge': {
        const c = this.add.circle(x, y, TILE / 2 - 4, 0xffd84d, 0.0).setStrokeStyle(2, 0xffd84d).setDepth(11);
        const bolt = this.add.text(cornerX, cornerY, '⚡', { fontSize: '20px', color: '#ffd84d' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: c, alpha: 0.7, duration: 600, yoyo: true, repeat: -1 });
        return [c, bolt];
      }
      case 'suicide-pawn': {
        const c = this.add.circle(x, y, TILE / 2 - 4, 0xff3030, 0.0).setStrokeStyle(2, 0xff3030).setDepth(11);
        const t = this.add.text(cornerX, cornerY, '💥', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: c, alpha: 0.6, duration: 400, yoyo: true, repeat: -1 });
        return [c, t];
      }
      case 'phantom': {
        const aura = this.add.circle(x, y, TILE / 2 - 4, 0x7cd1ff, 0.25).setDepth(9);
        const ghost = this.add.text(cornerX, cornerY, '👻', { fontSize: '22px' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: aura, alpha: 0.05, duration: 800, yoyo: true, repeat: -1 });
        return [aura, ghost];
      }
      case 'heir':
      case 'pawn-king': {
        const t = this.add.text(x, y - TILE / 2 + 6, '👑', { fontSize: '22px' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: t, y: y - TILE / 2 + 2, duration: 600, yoyo: true, repeat: -1 });
        return [t];
      }
      case 'royal-marriage': {
        const t = this.add.text(x, y - TILE / 2 + 8, '👑', { fontSize: '24px' }).setOrigin(0.5).setDepth(15);
        const ring = this.add.circle(x, y, TILE / 2 - 4, 0xff5edb, 0).setStrokeStyle(2, 0xff5edb, 0.7).setDepth(11);
        this.tweens.add({ targets: ring, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
        return [t, ring];
      }
      case 'mercenary': {
        const t = this.add.text(cornerX, cornerY, '🪙', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        const ring = this.add.circle(x, y, TILE / 2 - 4, 0xffd84d, 0).setStrokeStyle(2, 0xffd84d, 0.5).setDepth(11);
        this.tweens.add({ targets: ring, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });
        return [t, ring];
      }
      case 'iron-rook':
      case 'iron-skin': {
        const ring = this.add.rectangle(x, y, TILE - 6, TILE - 6, 0x999999, 0).setStrokeStyle(3, 0xaaaaaa, 0.8).setDepth(11);
        const icon = this.add.text(cornerX, cornerY, '🛡', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        return [ring, icon];
      }
      case 'decoy-king': {
        // Tiny crown only the placer should reasonably trust; everyone sees the same here for v1.
        const t = this.add.text(cornerX, cornerY, '🎭', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        return [t];
      }
      case 'disguise': {
        const t = this.add.text(cornerX, cornerY, '?', { fontFamily: '"Press Start 2P", monospace', fontSize: '20px', color: '#ffd84d' })
          .setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: t, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
        return [t];
      }
      case 'plague': {
        const aura = this.add.circle(x, y, TILE / 2 - 4, 0x7cff7a, 0.25).setDepth(11);
        const fly = this.add.text(cornerX, cornerY, '🦟', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: aura, alpha: 0.05, duration: 600, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: fly, x: cornerX + 4, duration: 400, yoyo: true, repeat: -1 });
        return [aura, fly];
      }
      case 'berserker-pawn': {
        const eyes = this.add.text(cornerX, cornerY, '😡', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        const ring = this.add.circle(x, y, TILE / 2 - 4, 0xff3030, 0).setStrokeStyle(2, 0xff3030, 0.7).setDepth(11);
        this.tweens.add({ targets: ring, alpha: 0.5, duration: 350, yoyo: true, repeat: -1 });
        return [eyes, ring];
      }
      case 'trojan': {
        const horse = this.add.text(cornerX, cornerY, '🐴', { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
        return [horse];
      }
      case 'chrono-lock': {
        const ring = this.add.circle(x, y, TILE / 2 - 4, 0x7cd1ff, 0).setStrokeStyle(2, 0x7cd1ff, 0.7).setDepth(11);
        const clock = this.add.text(cornerX, cornerY, '⏱', { fontSize: '20px', color: '#7cd1ff' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: ring, angle: 360, duration: 2500, repeat: -1 });
        return [ring, clock];
      }
      default:
        return [];
    }
  }

  renderLastMoveHighlight() {
    this.lastMoveHighlights.forEach(s => s.destroy());
    this.lastMoveHighlights = [];
    const last = this.state?.lastMove;
    if (!last) return;
    for (const sq of [last.from, last.to]) {
      const x = squareX(sq, this.myColor);
      const y = squareY(sq, this.myColor);
      const r = this.add.rectangle(x, y, TILE, TILE, LAST_MOVE, 0.45).setDepth(0.5);
      this.lastMoveHighlights.push(r);
    }
  }

  playEvents(events) {
    if (!this.created) return;
    for (const e of events || []) this.playOneEvent(e);
  }

  playOneEvent(e) {
    switch (e.type) {
      case 'explosion': {
        const x = squareX(e.center, this.myColor);
        const y = squareY(e.center, this.myColor);
        const c = this.add.circle(x, y, 4, 0xff5e3a, 1).setDepth(20);
        this.tweens.add({ targets: c, radius: TILE * (1 + (e.radius || 0)), alpha: 0, duration: 500, onComplete: () => c.destroy() });
        const ring = this.add.circle(x, y, TILE / 2, 0xffd84d, 0).setStrokeStyle(3, 0xffd84d).setDepth(20);
        this.tweens.add({ targets: ring, scale: 2 + (e.radius || 0), alpha: 0, duration: 500, onComplete: () => ring.destroy() });
        this.cameras.main.shake(200, 0.005);
        break;
      }
      case 'piece-killed': {
        const x = squareX(e.square, this.myColor);
        const y = squareY(e.square, this.myColor);
        const puff = this.add.circle(x, y, TILE / 3, 0x666666, 0.7).setDepth(20);
        this.tweens.add({ targets: puff, scale: 1.5, alpha: 0, duration: 400, onComplete: () => puff.destroy() });
        break;
      }
      case 'pieces-spawned': {
        // Used for spawn rules and dragon hatch.
        for (const sq of e.squares || []) {
          const x = squareX(sq, this.myColor);
          const y = squareY(sq, this.myColor);
          const flash = this.add.circle(x, y, TILE * 0.6, 0xffd84d, 0.7).setDepth(19);
          this.tweens.add({ targets: flash, scale: 1.3, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const star = this.add.text(x, y, '✦', { fontSize: '14px', color: '#ffd84d' }).setOrigin(0.5).setDepth(19);
            this.tweens.add({
              targets: star,
              x: x + Math.cos(angle) * TILE * 0.6,
              y: y + Math.sin(angle) * TILE * 0.6,
              alpha: 0,
              duration: 700,
              onComplete: () => star.destroy(),
            });
          }
        }
        break;
      }
      case 'lightning-strike': {
        const x = squareX(e.square, this.myColor);
        const y = squareY(e.square, this.myColor);
        const bolt = this.add.text(x, y - TILE, '⚡', { fontSize: '60px', color: '#ffd84d' }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: bolt, y, alpha: 0, duration: 250, onComplete: () => bolt.destroy() });
        this.cameras.main.flash(150, 255, 255, 200);
        break;
      }
      case 'rule-activated': {
        const category = e.rule?.category || 'Wild';
        const tint = CATEGORY_TINT[category] || 0xffd84d;
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const banner = this.add.rectangle(w / 2, h / 2, 620, 90, 0x0d0a1f, 0.95).setStrokeStyle(4, tint).setDepth(100);
        const cat = this.add.text(w / 2, h / 2 - 22, category.toUpperCase(), {
          fontFamily: '"Press Start 2P", monospace', fontSize: '12px', color: hexCss(tint),
        }).setOrigin(0.5).setDepth(101);
        const txt = this.add.text(w / 2, h / 2 + 8, e.rule?.name || 'CHAOS', {
          fontFamily: '"Press Start 2P", monospace', fontSize: '24px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(101);
        this.tweens.add({ targets: [banner, cat, txt], alpha: 0, duration: 400, delay: 1400, onComplete: () => { banner.destroy(); cat.destroy(); txt.destroy(); } });
        this.cameras.main.flash(150, (tint >> 16) & 0xff, (tint >> 8) & 0xff, tint & 0xff);
        break;
      }
      case 'apocalypse': {
        this.cameras.main.shake(800, 0.02);
        this.cameras.main.flash(800, 255, 80, 80);
        break;
      }
      case 'mind-control':
      case 'possession': {
        if (e.from && e.to) this.flashLink(e.from, e.to, 0x9933ff);
        break;
      }
      case 'mind-swap': {
        if (e.a && e.b) {
          this.flashLink(e.a, e.b, 0xff5edb);
          this.flashLink(e.b, e.a, 0xff5edb);
        }
        break;
      }
      case 'piece-defected': {
        const x = squareX(e.square, this.myColor);
        const y = squareY(e.square, this.myColor);
        const flag = this.add.text(x, y - TILE, '🏳', { fontSize: '40px' }).setOrigin(0.5).setDepth(21);
        this.tweens.add({ targets: flag, y, alpha: 0, duration: 600, onComplete: () => flag.destroy() });
        break;
      }
      case 'dream-walk': {
        if (e.from) {
          const x = squareX(e.from, this.myColor);
          const y = squareY(e.from, this.myColor);
          for (let i = 0; i < 12; i++) {
            const star = this.add.text(x, y, '✦', { fontSize: '16px', color: '#7cd1ff' }).setOrigin(0.5).setDepth(21);
            const dx = (Math.random() - 0.5) * TILE * 1.4;
            const dy = (Math.random() - 0.5) * TILE * 1.4;
            this.tweens.add({ targets: star, x: x + dx, y: y + dy, alpha: 0, duration: 700, onComplete: () => star.destroy() });
          }
        }
        if (e.to) this.flashTile(e.to, 0x7cd1ff);
        break;
      }
      case 'dance-step': {
        if (e.to) {
          const x = squareX(e.to, this.myColor);
          const y = squareY(e.to, this.myColor);
          const note = this.add.text(x, y - TILE / 2, '🎵', { fontSize: '28px' }).setOrigin(0.5).setDepth(21);
          this.tweens.add({ targets: note, y: y - TILE, alpha: 0, duration: 700, onComplete: () => note.destroy() });
        }
        break;
      }
      case 'plague-spread': {
        if (e.from && e.to) this.flashLink(e.from, e.to, 0x7cff7a);
        break;
      }
      case 'magnetic-pull':
      case 'magnetic-shift': {
        if (e.square) this.flashTile(e.square, 0x7cd1ff);
        if (e.from && e.to) this.flashLink(e.from, e.to, 0x7cd1ff);
        break;
      }
      case 'wormhole-traversed': {
        if (e.from) this.flashTile(e.from, 0x9933ff);
        if (e.to) this.flashTile(e.to, 0x9933ff);
        break;
      }
      case 'black-hole-devour': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const v = this.add.circle(x, y, TILE / 3, 0x000000, 0.9).setDepth(21);
          this.tweens.add({ targets: v, scale: 0.05, alpha: 0, duration: 500, onComplete: () => v.destroy() });
        }
        break;
      }
      case 'pit-triggered': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const dust = this.add.circle(x, y, TILE / 3, 0x553311, 0.7).setDepth(21);
          this.tweens.add({ targets: dust, scale: 1.6, alpha: 0, duration: 500, onComplete: () => dust.destroy() });
        }
        break;
      }
      case 'tripwire-triggered': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const beam = this.add.rectangle(0, y, this.cameras.main.width, 4, 0xff3030, 1).setDepth(21);
          this.tweens.add({ targets: beam, alpha: 0, duration: 400, onComplete: () => beam.destroy() });
          this.cameras.main.flash(120, 255, 80, 80);
        }
        break;
      }
      case 'spike-trap-triggered': {
        for (const sq of e.tiles || []) this.flashTile(sq, 0xff3030);
        this.cameras.main.shake(150, 0.008);
        break;
      }
      case 'time-warp':
      case 'groundhog-day': {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const txt = this.add.text(w / 2, h / 2, '⟲', { fontSize: '120px', color: '#a78bfa' }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, angle: -360, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
        break;
      }
      case 'fast-forward': {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const txt = this.add.text(w / 2, h / 2, '⟳⟳⟳', { fontSize: '64px', color: '#a78bfa' }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
        break;
      }
      case 'mirror-flipped': {
        this.cameras.main.flash(150, 200, 200, 255);
        break;
      }
      case 'reverse-gravity':
      case 'hurricane':
      case 'tsunami-wave': {
        this.cameras.main.shake(250, 0.006);
        break;
      }
      case 'tsunami-warning': {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const txt = this.add.text(w / 2, 60, '🌊 TSUNAMI INCOMING 🌊', {
          fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#7cd1ff',
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, alpha: 0, duration: 600, delay: 1200, onComplete: () => txt.destroy() });
        break;
      }
      case 'earthquake-shift':
      case 'hurricane-shift': {
        if (e.from && e.to) this.flashLink(e.from, e.to, 0xc8a85a);
        break;
      }
      case 'holy-resurrect':
      case 'heir-crowned': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const beam = this.add.rectangle(x, y - 200, TILE * 0.7, 400, 0xffffff, 0.6).setDepth(19);
          this.tweens.add({ targets: beam, alpha: 0, duration: 800, onComplete: () => beam.destroy() });
          for (let i = 0; i < 12; i++) {
            const star = this.add.text(x, y, '✦', { fontSize: '14px', color: '#ffd84d' }).setOrigin(0.5).setDepth(20);
            const angle = (Math.PI * 2 * i) / 12;
            this.tweens.add({
              targets: star,
              x: x + Math.cos(angle) * TILE * 0.7,
              y: y + Math.sin(angle) * TILE * 0.7,
              alpha: 0, duration: 800,
              onComplete: () => star.destroy(),
            });
          }
        }
        break;
      }
      case 'iron-rook-saved':
      case 'iron-skin-saved': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const sparks = this.add.text(x, y, '✦', { fontSize: '40px', color: '#bbbbbb' }).setOrigin(0.5).setDepth(20);
          this.tweens.add({ targets: sparks, scale: 1.6, alpha: 0, duration: 500, onComplete: () => sparks.destroy() });
        }
        break;
      }
      case 'vampire-feed': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          for (let i = 0; i < 6; i++) {
            const drop = this.add.text(x, y, '·', { fontSize: '24px', color: '#ff3030' }).setOrigin(0.5).setDepth(20);
            this.tweens.add({ targets: drop, x: x + (Math.random() - 0.5) * TILE, y: y + TILE / 2, alpha: 0, duration: 600, onComplete: () => drop.destroy() });
          }
        }
        break;
      }
      case 'coin-flip': {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const coin = this.add.text(w / 2, h / 2, '🪙', { fontSize: '80px' }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: coin, scaleY: -1, duration: 500, yoyo: true, repeat: 1 });
        this.tweens.add({ targets: coin, alpha: 0, delay: 1200, duration: 400, onComplete: () => coin.destroy() });
        break;
      }
      case 'roulette': {
        for (const sq of e.candidates || []) this.flashTile(sq, 0xff3030);
        if (e.victim) {
          const x = squareX(e.victim, this.myColor);
          const y = squareY(e.victim, this.myColor);
          const skull = this.add.text(x, y, '☠', { fontSize: '60px', color: '#ff3030' }).setOrigin(0.5).setDepth(21);
          this.tweens.add({ targets: skull, alpha: 0, scale: 1.5, duration: 700, onComplete: () => skull.destroy() });
        }
        break;
      }
      case 'doomsday-strike':
      case 'cursed-strike': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const raven = this.add.text(x, y - TILE * 1.2, '🦅', { fontSize: '40px' }).setOrigin(0.5).setDepth(21);
          this.tweens.add({ targets: raven, y, alpha: 0, duration: 600, onComplete: () => raven.destroy() });
        }
        break;
      }
      case 'cluster-marked':
      case 'mines-placed': {
        for (const sq of e.tiles || []) this.flashTile(sq, 0xff3030);
        break;
      }
      case 'lava-tiles':
      case 'walls-built':
      case 'volcano-warning':
      case 'mine-placed':
      case 'pit-placed':
      case 'tripwire-set':
      case 'tar-pit-set':
      case 'cursed-square-set':
      case 'pause-tile-set':
      case 'holy-ground-set':
      case 'doomsday-tile-marked':
      case 'royal-recruit-marked':
      case 'dragon-egg-laid':
      case 'quicksand-tiles':
      case 'acid-pool':
      case 'black-hole-opened':
      case 'wormhole-set': {
        // tile-effect placement events: ping the squares for visibility
        const tiles = e.tiles || (e.square ? [e.square] : []);
        for (const sq of tiles) this.flashTile(sq, 0xffd84d);
        break;
      }
      case 'lava-burn': {
        if (e.square) {
          const x = squareX(e.square, this.myColor);
          const y = squareY(e.square, this.myColor);
          const fire = this.add.text(x, y, '🔥', { fontSize: '40px' }).setOrigin(0.5).setDepth(21);
          this.tweens.add({ targets: fire, alpha: 0, scale: 1.4, duration: 500, onComplete: () => fire.destroy() });
        }
        break;
      }
      case 'turn-skipped': {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const txt = this.add.text(w / 2, h / 2, 'TURN SKIPPED', {
          fontFamily: '"Press Start 2P", monospace', fontSize: '24px', color: '#7cd1ff',
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, alpha: 0, duration: 600, delay: 700, onComplete: () => txt.destroy() });
        break;
      }
      case 'extra-turn-active': {
        const w = this.cameras.main.width;
        const txt = this.add.text(w / 2, 60, 'EXTRA TURN', {
          fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#ffd84d',
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, alpha: 0, duration: 600, delay: 800, onComplete: () => txt.destroy() });
        break;
      }
      case 'plague-start': {
        if (e.square) this.flashTile(e.square, 0x7cff7a);
        break;
      }
    }
  }

  // Brief tile flash for highlights.
  flashTile(sq, color) {
    const x = squareX(sq, this.myColor);
    const y = squareY(sq, this.myColor);
    const r = this.add.rectangle(x, y, TILE, TILE, color, 0.6).setDepth(19);
    this.tweens.add({ targets: r, alpha: 0, duration: 600, onComplete: () => r.destroy() });
  }

  // Draw a brief animated link between two squares.
  flashLink(fromSq, toSq, color) {
    const x1 = squareX(fromSq, this.myColor);
    const y1 = squareY(fromSq, this.myColor);
    const x2 = squareX(toSq, this.myColor);
    const y2 = squareY(toSq, this.myColor);
    const seed = this.add.circle(x1, y1, 8, color, 0.9).setDepth(21);
    this.tweens.add({ targets: seed, x: x2, y: y2, alpha: 0.2, scale: 1.5, duration: 500, onComplete: () => seed.destroy() });
    this.flashTile(fromSq, color);
    this.flashTile(toSq, color);
  }
}

const CATEGORY_TINT = {
  Explosive: 0xff5e3a,
  Summoning: 0x7cff7a,
  Movement:  0x7cd1ff,
  Time:      0xa78bfa,
  Transform: 0xffd84d,
  Weather:   0xa6e3ff,
  Mind:      0x9933ff,
  Trap:      0xff3030,
  Buff:      0xffd84d,
  Wild:      0xf0e8d8,
};

function hexCss(num) {
  return '#' + num.toString(16).padStart(6, '0');
}

function parseFEN(fen) {
  const out = {};
  if (!fen) return out;
  const board = fen.split(' ')[0];
  const ranks = board.split('/');
  for (let r = 0; r < 8; r++) {
    let f = 0;
    for (const c of ranks[r]) {
      if (/\d/.test(c)) f += parseInt(c, 10);
      else {
        const sq = `${FILES[f]}${RANKS[7 - r]}`;
        out[sq] = { type: c.toLowerCase(), color: c === c.toUpperCase() ? 'w' : 'b' };
        f++;
      }
    }
  }
  return out;
}

function squareX(sq, myColor) {
  const f = FILES.indexOf(sq[0]);
  const fi = myColor === 'black' ? 7 - f : f;
  return ORIGIN_X + fi * TILE + TILE / 2;
}

function squareY(sq, myColor) {
  const r = RANKS.indexOf(sq[1]);
  const ri = myColor === 'black' ? r : 7 - r;
  return ORIGIN_Y + ri * TILE + TILE / 2;
}
