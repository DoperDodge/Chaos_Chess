import { DEFAULT_LOBBY_SETTINGS } from '@chaotic-chess/shared/constants';
import { GameSession } from '../game/session.js';

export class Lobby {
  constructor(code, hostSocketId, hostName, settings = {}) {
    this.code = code;
    this.private = !!settings.private;
    this.name = settings.name || `${hostName}'s Lobby`;
    this.settings = { ...DEFAULT_LOBBY_SETTINGS, ...settings };
    this.host = { socketId: hostSocketId, name: hostName, color: null, ready: false, banlist: [] };
    this.guest = null;
    this.spectators = [];
    this.game = null;
    this.gameStarted = false;
    this.createdAt = Date.now();
  }

  join(socketId, name) {
    if (this.guest) return { ok: false, error: 'lobby full' };
    if (this.host.socketId === socketId) return { ok: false, error: 'already host' };
    this.guest = { socketId, name, color: null, ready: false, banlist: [] };
    return { ok: true };
  }

  addSpectator(socketId, name) {
    if (!this.settings.spectatorsAllowed) return { ok: false, error: 'spectators not allowed' };
    this.spectators.push({ socketId, name });
    return { ok: true };
  }

  setReady(socketId, ready) {
    const player = this.playerFor(socketId);
    if (!player) return false;
    player.ready = !!ready;
    return true;
  }

  setBanlist(socketId, banlist) {
    const player = this.playerFor(socketId);
    if (!player) return false;
    player.banlist = (banlist || []).slice(0, 5).map(Number).filter(Number.isFinite);
    return true;
  }

  bothReady() {
    return this.host.ready && this.guest?.ready;
  }

  playerFor(socketId) {
    if (this.host?.socketId === socketId) return this.host;
    if (this.guest?.socketId === socketId) return this.guest;
    return null;
  }

  opponentOf(socketId) {
    if (this.host?.socketId === socketId) return this.guest;
    if (this.guest?.socketId === socketId) return this.host;
    return null;
  }

  removeSocket(socketId) {
    if (this.host?.socketId === socketId) {
      // Host leaves -> destroy lobby
      this.host = null;
      return 'host-left';
    }
    if (this.guest?.socketId === socketId) {
      this.guest = null;
      return 'guest-left';
    }
    const idx = this.spectators.findIndex(s => s.socketId === socketId);
    if (idx >= 0) {
      this.spectators.splice(idx, 1);
      return 'spectator-left';
    }
    return null;
  }

  startGame() {
    if (!this.bothReady()) return { ok: false, error: 'not all ready' };
    // Assign colors
    let hostColor = this.settings.startingColor;
    if (hostColor === 'random') hostColor = Math.random() < 0.5 ? 'white' : 'black';
    this.host.color = hostColor;
    this.guest.color = hostColor === 'white' ? 'black' : 'white';
    const combinedBanlist = [...new Set([...this.host.banlist, ...this.guest.banlist])];
    this.game = new GameSession({
      whiteSocketId: hostColor === 'white' ? this.host.socketId : this.guest.socketId,
      blackSocketId: hostColor === 'white' ? this.guest.socketId : this.host.socketId,
      whiteName: hostColor === 'white' ? this.host.name : this.guest.name,
      blackName: hostColor === 'white' ? this.guest.name : this.host.name,
      settings: this.settings,
      banlist: combinedBanlist,
    });
    this.gameStarted = true;
    return { ok: true, game: this.game };
  }

  summary() {
    return {
      code: this.code,
      name: this.name,
      private: this.private,
      hostName: this.host?.name || null,
      hasGuest: !!this.guest,
      ruleSelectionInterval: this.settings.ruleSelectionInterval,
      timeControl: this.settings.timeControl,
      gameStarted: this.gameStarted,
    };
  }

  detail() {
    return {
      ...this.summary(),
      settings: this.settings,
      host: this.host && { name: this.host.name, color: this.host.color, ready: this.host.ready, banlist: this.host.banlist },
      guest: this.guest && { name: this.guest.name, color: this.guest.color, ready: this.guest.ready, banlist: this.guest.banlist },
      spectators: this.spectators.map(s => ({ name: s.name })),
    };
  }

  allSocketIds() {
    const ids = [];
    if (this.host) ids.push(this.host.socketId);
    if (this.guest) ids.push(this.guest.socketId);
    for (const s of this.spectators) ids.push(s.socketId);
    return ids;
  }
}
