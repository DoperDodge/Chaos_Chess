import { Lobby } from './lobby.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // skip ambiguous chars
function randomCode(length = 6) {
  let out = '';
  for (let i = 0; i < length; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export class LobbyRegistry {
  constructor() {
    this.lobbies = new Map(); // code -> Lobby
  }

  create(hostSocketId, hostName, settings = {}) {
    let code;
    do { code = randomCode(); } while (this.lobbies.has(code));
    const lobby = new Lobby(code, hostSocketId, hostName, settings);
    this.lobbies.set(code, lobby);
    return lobby;
  }

  get(code) {
    return this.lobbies.get((code || '').toUpperCase());
  }

  remove(code) {
    return this.lobbies.delete(code);
  }

  publicList() {
    return [...this.lobbies.values()]
      .filter(l => !l.private && !l.gameStarted)
      .map(l => l.summary());
  }

  publicCount() {
    return this.publicList().length;
  }

  // Find any lobby this socket is part of (host or guest)
  findBySocket(socketId) {
    for (const lobby of this.lobbies.values()) {
      if (lobby.host?.socketId === socketId || lobby.guest?.socketId === socketId) {
        return lobby;
      }
    }
    return null;
  }
}
