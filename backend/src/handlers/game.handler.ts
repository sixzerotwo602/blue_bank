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

  socket.on('game:end', (roomId: string) => {
      const room = store.rooms.get(roomId);
      if (!room) return;
      if (room.hostId !== socket.id) return; // Host only

      room.status = 'ENDED';

      // Calculate Rankings (Cash + AssetValue)
      // We map to a new structure to include totalAssets and rank
      const rankings = room.players
          .map(p => ({
              id: p.id,
              nickname: p.nickname,
              cash: p.cash,
              assetValue: p.assetValue,
              totalAssets: p.cash + p.assetValue,
              rank: 0 
          }))
          .sort((a, b) => b.totalAssets - a.totalAssets);

      // Assign Rank
      rankings.forEach((r, index) => {
          r.rank = index + 1;
      });

      // Broadcast
      io.to(roomId).emit('game:ended', { rankings });
      io.to(roomId).emit('room:sync', room);
  });
};
