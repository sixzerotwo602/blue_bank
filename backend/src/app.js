import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
export const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all for MVP, restrict later
        methods: ['GET', 'POST'],
    },
});
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers } from './handlers/game.handler.js';
import { registerTransactionHandlers } from './handlers/transaction.handler.js';
import { registerVoteHandlers } from './handlers/vote.handler.js';
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerTransactionHandlers(io, socket);
    registerVoteHandlers(io, socket);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
export default app;
//# sourceMappingURL=app.js.map