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
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

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
  app.use(express.static(frontendPath, {
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/') || filePath.includes('\\assets\\')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  // SPA fallback: socket.io 외 모든 경로 → index.html (Express 5 문법)
  app.get('/{*path}', (req, res) => {
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
  // 프로덕션: Origin 검증 (WebSocket CSWSH 방지)
  ...(isProduction && ALLOWED_ORIGIN && {
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      if (origin && origin !== ALLOWED_ORIGIN) {
        console.warn(`[Security] Rejected WebSocket from origin: ${origin}`);
        callback('Origin not allowed', false);
        return;
      }
      callback(null, true);
    },
  }),
});

import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers } from './handlers/game.handler.js';
import { registerTransactionHandlers } from './handlers/transaction.handler.js';
import { registerVoteHandlers } from './handlers/vote.handler.js';
import { registerConnectionHandlers } from './handlers/connection.handler.js';
import { registerNotificationHandlers } from './handlers/notification.handler.js';
import { notificationUseCases, votingUseCases, transactionUseCases, gameUseCases } from './application/container.js';
import { SESSION_CLEANUP_INTERVAL_MS, MAX_ROOM_AGE_MS } from './utils/constants.js';
import { getClientIp } from './utils/helpers.js';
import { rateLimiter } from './utils/rate-limiter.js';

io.on('connection', (socket) => {
  const clientIp = getClientIp(socket);
  console.log(`Client connected: ${socket.id} [${clientIp}]`);

  registerRoomHandlers(io, socket, gameUseCases);
  registerGameHandlers(io, socket, gameUseCases, votingUseCases);
  registerTransactionHandlers(io, socket, gameUseCases, transactionUseCases, notificationUseCases);
  registerVoteHandlers(io, socket, gameUseCases, votingUseCases);
  registerConnectionHandlers(io, socket, gameUseCases);
  registerNotificationHandlers(io, socket, notificationUseCases);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id} [${clientIp}]`);
  });
});

// 세션 정리 타이머
setInterval(() => {
  const cleaned = gameUseCases.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }

  // 24시간 초과 방 자동 정리
  gameUseCases.cleanupExpiredRooms(MAX_ROOM_AGE_MS);

  // Rate limiter 만료 레코드 정리
  rateLimiter.cleanup();
}, SESSION_CLEANUP_INTERVAL_MS);

export default app;
