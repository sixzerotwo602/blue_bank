import { Server, Socket } from 'socket.io';
import { store } from '../models/store.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

export const registerGameHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  socket.on('game:start', (initialCash: number) => {
    // Find room where this socket is host
    let targetRoomId: string | undefined;
    
    for (const room of store.rooms.values()) {
        if (room.hostId === socket.id) {
            targetRoomId = room.id;
            break;
        }
    }

    if (!targetRoomId) {
        return; 
    }

    const room = store.rooms.get(targetRoomId)!;
    
    if (room.status !== 'LOBBY') {
        return;
    }

    // Update status
    room.status = 'PLAYING';
    
    // Apply Initial Cash
    // If initialCash is valid (e.g. > 0), apply it. Otherwise keep default (0).
    if (initialCash && initialCash > 0) {
        room.players.forEach(p => {
            p.cash = initialCash;
        });
    }

    // Notify all
    io.to(targetRoomId).emit('game:started');
    io.to(targetRoomId).emit('room:sync', room);
  });
};
