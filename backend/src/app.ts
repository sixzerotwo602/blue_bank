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

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents
>(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://blue-banker.pages.dev",
      "https://*.pages.dev"
    ],
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

