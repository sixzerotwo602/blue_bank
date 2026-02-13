import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

// 개발 환경 CORS 허용 origin 목록
const devCorsOrigins = [
  "http://localhost:15485",
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:15485$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:15485$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:15485$/,
];

const app = express();
app.use(express.json());

// 개발 환경에서만 CORS 적용 (프로덕션은 Same-Origin)
if (!isProduction) {
  app.use(cors({ origin: devCorsOrigins, credentials: true }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is awake!');
});

// 프로덕션: 프론트엔드 정적 파일 서빙
if (isProduction) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // SPA fallback: socket.io 외 모든 경로 → index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

export const httpServer = createServer(app);

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents
>(httpServer, {
  // 프로덕션: Same-Origin이므로 CORS 불필요, 개발: CORS 허용
  ...(!isProduction && {
    cors: {
      origin: devCorsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  }),
});

import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers } from './handlers/game.handler.js';
import { registerTransactionHandlers } from './handlers/transaction.handler.js';
import { registerVoteHandlers } from './handlers/vote.handler.js';
import { registerConnectionHandlers } from './handlers/connection.handler.js';
import { connectionService } from './services/connection.service.js';
import { SESSION_CLEANUP_INTERVAL_MS } from './utils/constants.js';

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerTransactionHandlers(io, socket);
  registerVoteHandlers(io, socket);
  registerConnectionHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Session cleanup timer (T029) - runs every minute
setInterval(() => {
  const cleaned = connectionService.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }
}, SESSION_CLEANUP_INTERVAL_MS);

export default app;
