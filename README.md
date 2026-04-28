# Chaotic Chess

A multiplayer 2D chess variant where standard chess is the baseline, but every few turns a chaos rule activates and warps the game.

Built per `chaotic_chess_spec.md`.

## Stack

- **Server:** Node.js + Express + Socket.IO (server-authoritative game state)
- **Client:** React + Vite + Phaser 3 + Tailwind CSS
- **Chess engine:** chess.js
- **Deploy target:** Railway (single Node service serves API + built client bundle)

## Local development

```bash
npm install
# Terminal 1 - server (port 3001 by default)
npm run dev:server
# Terminal 2 - client (Vite dev server, proxies to server)
npm run dev:client
```

Client dev server: http://localhost:5173
Server: http://localhost:3001

## Production / Railway

Railway runs `npm install && npm run build` then `npm start`. The Express server serves the built client from `client/dist`.

## Project layout

```
.
├── client/                  React + Phaser frontend
│   ├── src/
│   │   ├── lobby/           Lobby UI
│   │   ├── game/            Phaser scenes + rule renderers
│   │   └── shared/          Cross-cutting client code
│   └── public/
├── server/                  Node + Express + Socket.IO
│   └── src/
│       ├── lobby/           Lobby management
│       ├── game/            Game state + turn logic
│       ├── rules/           One module per rule (server-side effect)
│       └── sockets/         Socket.IO event handlers
├── shared/                  Cross-package metadata
│   └── rules.js             100 rule metadata
└── chaotic_chess_spec.md    Source of truth
```

## The 100 rules

Rule metadata for all 100 rules lives in `shared/rules.js`. Server-side mechanics for each rule live in `server/src/rules/<id>.js`. Client-side animations live in `client/src/game/rules/<id>.js`. Rules without an implementation file fall through to a no-op activation so the game stays playable.
