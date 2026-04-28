import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './sockets/index.js';
import { LobbyRegistry } from './lobby/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CLIENT_DIST = path.join(PROJECT_ROOT, 'client', 'dist');

const app = express();
app.use(cors());
app.use(express.json());

const lobbyRegistry = new LobbyRegistry();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), lobbies: lobbyRegistry.publicCount() });
});

app.get('/api/lobbies', (_req, res) => {
  res.json({ lobbies: lobbyRegistry.publicList() });
});

// Serve built client (production / Railway)
app.use(express.static(CLIENT_DIST));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
    if (err) res.status(404).send('Client not built. Run `npm run build`.');
  });
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

registerSocketHandlers(io, lobbyRegistry);

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[chaotic-chess] server listening on :${PORT}`);
});
