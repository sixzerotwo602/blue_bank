import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import { voteService } from '../services/vote.service.js';
import { store } from '../models/store.js';

export const registerVoteHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  const getRoomId = () => {
     for (const room of store.rooms.values()) {
        if (room.players.some(p => p.id === socket.id)) {
            return room.id;
        }
     }
     return null;
  };

  socket.on('vote:request_fund', (_amount: number) => {
    try {
        const roomId = getRoomId();
        if (!roomId) throw new Error('방을 찾을 수 없습니다');

        // T015: Use full amount
        const room = store.rooms.get(roomId);
        if (!room) throw new Error('방을 찾을 수 없습니다');
        
        const fullAmount = room.welfareFund;
        if (fullAmount <= 0) throw new Error('복지기금이 없습니다.');

        const vote = voteService.createVote(roomId, socket.id, fullAmount);
        
        io.to(roomId).emit('vote:started', vote);
        io.to(roomId).emit('vote:updated', vote); // Initial state

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote request failed');
    }
  });

  socket.on('vote:cast', (voteId: string, approve: boolean) => {
    try {
        const vote = voteService.castVote(voteId, socket.id, approve);
        
        // Emit update
        io.to(vote.roomId).emit('vote:updated', vote);

        // If ended, emit ended and room sync (since money changed)
        if (vote.status !== 'IN_PROGRESS') {
             io.to(vote.roomId).emit('vote:ended', vote);
             
             const room = store.rooms.get(vote.roomId);
             if (room) {
                 io.to(vote.roomId).emit('room:sync', room);
             }
        }

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote cast failed');
    }
  });
};
