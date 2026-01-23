import { Server, Socket } from 'socket.io';
import { store } from '../models/store.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

export const registerGameHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  socket.on('game:start', () => { // No args?
    // Find room where this socket is host
    // Since we don't track "socket -> room" in efficient map (only store.rooms which is room -> players),
    // we iterate or use room ID from client? 
    // BUT 'game:start' event usually sends roomId or we infer it.
    // ClientToServerEvents 'game:start' signature in shared?
    // Let's check shared.
    // Spec says: game:start() - no args.
    
    // So we must find the room the player is in.
    let targetRoomId: string | undefined;
    
    // Inefficient search
    for (const room of store.rooms.values()) {
        if (room.hostId === socket.id) {
            targetRoomId = room.id;
            break;
        }
    }

    if (!targetRoomId) {
        // Not host or not in room
        return; 
    }

    const room = store.rooms.get(targetRoomId)!;
    
    if (room.status !== 'LOBBY') {
        return;
    }

    // Update status
    // In a real app we might verify min players
    room.status = 'PLAYING';
    
    // Notify all
    io.to(targetRoomId).emit('game:started');
    io.to(targetRoomId).emit('room:sync', room);
  });
};
