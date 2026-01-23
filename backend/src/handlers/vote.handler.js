import { Server, Socket } from 'socket.io';
import { voteService } from '../services/vote.service.js';
import { store } from '../models/store.js';
export const registerVoteHandlers = (io, socket) => {
    const getRoomId = () => {
        for (const room of store.rooms.values()) {
            if (room.players.some(p => p.id === socket.id)) {
                return room.id;
            }
        }
        return null;
    };
    socket.on('vote:request_fund', (amount) => {
        try {
            const roomId = getRoomId();
            if (!roomId)
                throw new Error('Room not found');
            const vote = voteService.createVote(roomId, socket.id, amount);
            io.to(roomId).emit('vote:started', vote);
            io.to(roomId).emit('vote:updated', vote); // Initial state
        }
        catch (error) {
            socket.emit('error', error.message || 'Vote request failed');
        }
    });
    socket.on('vote:cast', (voteId, approve) => {
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
        }
        catch (error) {
            socket.emit('error', error.message || 'Vote cast failed');
        }
    });
};
//# sourceMappingURL=vote.handler.js.map