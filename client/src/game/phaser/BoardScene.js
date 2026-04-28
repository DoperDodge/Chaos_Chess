import Phaser from 'phaser';

const TILE = 80;            // 8 * 80 = 640
const ORIGIN_X = 40;
const ORIGIN_Y = 40;
const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

const PIECE_GLYPH = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const LIGHT = 0xe5d4a0;
const DARK = 0x6e3f1d;
const HILIGHT = 0xffd84d;
const FROM_HI = 0x7cd1ff;
const LAVA = 0xff5e3a;
const ICE_TINT = 0xa6e3ff;
const WALL = 0x4a3a78;
const MARK = 0xff3030;

export class BoardScene extends Phaser.Scene {
  constructor() {
    super('BoardScene');
    this.tileSprites = {};        // sq -> rectangle
    this.pieceSprites = {};       // sq -> text
    this.tileEffectSprites = {};  // sq -> [sprites]
    this.pieceEffectSprites = {}; // sq -> [sprites]
    this.fromSquare = null;
    this.toHighlights = [];
    this.state = null;
    this.myColor = 'white';
  }

  init(data) {
    this.hooks = data?.hooks || {};
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0a1f);

    // Decorative border
    this.add.rectangle(ORIGIN_X + TILE * 4, ORIGIN_Y + TILE * 4, TILE * 8 + 16, TILE * 8 + 16, 0x1a1033)
      .setStrokeStyle(4, 0xffd84d);

    // Tiles
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const sq = `${FILES[f]}${RANKS[r]}`;
        const x = ORIGIN_X + f * TILE + TILE / 2;
        const y = ORIGIN_Y + (7 - r) * TILE + TILE / 2;
        const dark = (f + r) % 2 === 0;
        const rect = this.add.rectangle(x, y, TILE - 2, TILE - 2, dark ? DARK : LIGHT)
          .setInteractive()
          .setStrokeStyle(0)
          .setData('sq', sq);
        rect.on('pointerdown', () => this.handleClick(sq));
        this.tileSprites[sq] = rect;
        // Tile coordinate label
        if (r === 0) {
          this.add.text(x, y + TILE / 2 - 14, FILES[f].toUpperCase(), {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffd84d',
          }).setOrigin(0.5);
        }
        if (f === 0) {
          this.add.text(x - TILE / 2 + 8, y, RANKS[r], {
            fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffd84d',
          }).setOrigin(0.5);
        }
      }
    }

    // Particle / FX layer container is implicit (we just add sprites)
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
      this.tileSprites[sq]?.setFillStyle(FROM_HI);
    }
  }

  clearSelection() {
    if (this.fromSquare && this.tileSprites[this.fromSquare]) {
      const f = FILES.indexOf(this.fromSquare[0]);
      const r = RANKS.indexOf(this.fromSquare[1]);
      const dark = (f + r) % 2 === 0;
      this.tileSprites[this.fromSquare].setFillStyle(dark ? DARK : LIGHT);
    }
    this.fromSquare = null;
  }

  applyState(state, myColor) {
    this.state = state;
    if (myColor) this.myColor = myColor;
    this.renderPieces();
    this.renderTileEffects();
    this.renderPieceEffects();
    this.renderLastMoveHighlight();
  }

  renderPieces() {
    const board = parseFEN(this.state.fen);
    // Remove sprites for missing pieces
    for (const sq of Object.keys(this.pieceSprites)) {
      if (!board[sq]) {
        this.pieceSprites[sq].destroy();
        delete this.pieceSprites[sq];
      }
    }
    // Add / update
    for (const sq of Object.keys(board)) {
      const p = board[sq];
      const glyph = PIECE_GLYPH[p.color][p.type];
      const x = squareX(sq, this.myColor);
      const y = squareY(sq, this.myColor);
      let sprite = this.pieceSprites[sq];
      if (!sprite) {
        sprite = this.add.text(x, y, glyph, {
          fontFamily: 'serif',
          fontSize: '60px',
          color: p.color === 'w' ? '#f8f8f8' : '#1a1033',
          stroke: p.color === 'w' ? '#1a1033' : '#f0e8d8',
          strokeThickness: 3,
        }).setOrigin(0.5);
        this.pieceSprites[sq] = sprite;
      } else {
        sprite.setText(glyph);
        sprite.setColor(p.color === 'w' ? '#f8f8f8' : '#1a1033');
        sprite.setStroke(p.color === 'w' ? '#1a1033' : '#f0e8d8', 3);
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
    const effects = this.state.tileEffects || {};
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
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, LAVA, 0.8);
        this.tweens.add({ targets: r, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'mine': {
        // Subtle visual; mine is "invisible" but we hint with a tiny dot.
        const r = this.add.circle(x, y, 4, 0x66cc66, 0.4);
        return [r];
      }
      case 'cluster-marker': {
        const r = this.add.text(x, y, 'X', { fontFamily: '"Press Start 2P", monospace', fontSize: '24px', color: '#ff3030' }).setOrigin(0.5);
        this.tweens.add({ targets: r, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'doomsday': {
        const r = this.add.rectangle(x, y, TILE - 6, TILE - 6, 0x9933ff, 0.4);
        this.tweens.add({ targets: r, alpha: 0.8, duration: 500, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'volcano-warning': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0xff3030, 0.5);
        this.tweens.add({ targets: r, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
        return [r];
      }
      case 'wall': {
        const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, WALL, 1).setStrokeStyle(2, 0xffd84d);
        const txt = this.add.text(x, y, '▦', { fontFamily: 'serif', fontSize: '32px', color: '#ffd84d' }).setOrigin(0.5);
        return [r, txt];
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
    const effects = this.state.pieceEffects || {};
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
    switch (effect.type) {
      case 'bomb': {
        const t = this.add.text(x + TILE / 3, y - TILE / 3, '💣', { fontSize: '20px' }).setOrigin(0.5);
        this.tweens.add({ targets: t, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });
        return [t];
      }
      case 'frozen': {
        const t = this.add.text(x + TILE / 3, y - TILE / 3, '❄', { fontSize: '20px', color: '#7cd1ff' }).setOrigin(0.5);
        return [t];
      }
      case 'cursed': {
        const t = this.add.text(x + TILE / 3, y - TILE / 3, '☠', { fontSize: '20px', color: '#9933ff' }).setOrigin(0.5);
        return [t];
      }
      case 'speed-demon':
      case 'berserker':
      case 'power-surge': {
        const c = this.add.circle(x, y, TILE / 2 - 4, 0xffd84d, 0.0).setStrokeStyle(2, 0xffd84d);
        this.tweens.add({ targets: c, alpha: 0.7, duration: 600, yoyo: true, repeat: -1 });
        return [c];
      }
      case 'suicide-pawn': {
        const c = this.add.circle(x, y, TILE / 2 - 4, 0xff3030, 0.0).setStrokeStyle(2, 0xff3030);
        this.tweens.add({ targets: c, alpha: 0.6, duration: 400, yoyo: true, repeat: -1 });
        return [c];
      }
      default:
        return [];
    }
  }

  renderLastMoveHighlight() {
    this.toHighlights.forEach(s => s.destroy());
    this.toHighlights = [];
    const last = this.state.lastMove;
    if (!last) return;
    for (const sq of [last.from, last.to]) {
      const x = squareX(sq, this.myColor);
      const y = squareY(sq, this.myColor);
      const r = this.add.rectangle(x, y, TILE - 4, TILE - 4, FROM_HI, 0.25);
      this.toHighlights.push(r);
    }
  }

  playEvents(events) {
    for (const e of events || []) this.playOneEvent(e);
  }

  playOneEvent(e) {
    switch (e.type) {
      case 'explosion': {
        const x = squareX(e.center, this.myColor);
        const y = squareY(e.center, this.myColor);
        const c = this.add.circle(x, y, 4, 0xff5e3a, 1);
        this.tweens.add({
          targets: c,
          radius: TILE * (1 + (e.radius || 0)),
          alpha: 0,
          duration: 500,
          onComplete: () => c.destroy(),
        });
        // Use scale on a rectangle as fallback
        const ring = this.add.circle(x, y, TILE / 2, 0xffd84d, 0).setStrokeStyle(3, 0xffd84d);
        this.tweens.add({
          targets: ring,
          scale: 2 + (e.radius || 0),
          alpha: 0,
          duration: 500,
          onComplete: () => ring.destroy(),
        });
        this.cameras.main.shake(200, 0.005);
        break;
      }
      case 'piece-killed': {
        const x = squareX(e.square, this.myColor);
        const y = squareY(e.square, this.myColor);
        const puff = this.add.circle(x, y, TILE / 3, 0x666666, 0.7);
        this.tweens.add({ targets: puff, scale: 1.5, alpha: 0, duration: 400, onComplete: () => puff.destroy() });
        break;
      }
      case 'lightning-strike': {
        const x = squareX(e.square, this.myColor);
        const y = squareY(e.square, this.myColor);
        const bolt = this.add.text(x, y - TILE, '⚡', { fontSize: '60px', color: '#ffd84d' }).setOrigin(0.5);
        this.tweens.add({ targets: bolt, y, alpha: 0, duration: 250, onComplete: () => bolt.destroy() });
        this.cameras.main.flash(150, 255, 255, 200);
        break;
      }
      case 'rule-activated': {
        // Show a banner for ~1.5 seconds
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        const banner = this.add.rectangle(w / 2, h / 2, 600, 80, 0x1a1033, 0.95).setStrokeStyle(3, 0xffd84d).setDepth(100);
        const txt = this.add.text(w / 2, h / 2, e.rule?.name || 'CHAOS', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '28px',
          color: '#ffd84d',
        }).setOrigin(0.5).setDepth(101);
        this.tweens.add({ targets: [banner, txt], alpha: 0, duration: 400, delay: 1300, onComplete: () => { banner.destroy(); txt.destroy(); } });
        this.cameras.main.flash(150, 255, 255, 255);
        break;
      }
      case 'apocalypse': {
        this.cameras.main.shake(800, 0.02);
        this.cameras.main.flash(800, 255, 80, 80);
        break;
      }
    }
  }
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
