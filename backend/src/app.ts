import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint for Cron-job.org
app.get('/health', (req, res) => {
  res.status(200).send('Server is awake!');
});

export const httpServer = createServer(app);

// CORS origin 설정: 프로덕션과 개발 환경 분리
const getCorsOrigins = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // 프로덕션: 허용된 도메인만
    return [
      "https://blue-banker.pages.dev",
      "https://*.pages.dev"
    ];
  }

  // 개발 환경: localhost + 내부망 IP 허용
  return [
    "http://localhost:15485",
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:15485$/,  // 192.168.*.* 대역
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:15485$/, // 10.*.*.* 대역
    /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:15485$/, // 172.16-31.*.* 대역
  ];
};

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents
>(httpServer, {
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers } from './handlers/game.handler.js';
import { registerTransactionHandlers } from './handlers/transaction.handler.js';
import { registerVoteHandlers } from './handlers/vote.handler.js';
import { registerConnectionHandlers } from './handlers/connection.handler.js';
import { connectionService } from './services/connection.service.js';

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
}, 60 * 1000);

export default app;

