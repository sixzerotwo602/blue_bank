import { Server, Socket } from 'socket.io';
import { roomService } from '../services/room.service.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

export const registerRoomHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  socket.on('room:create', (nickname, callback) => {
    try {
      const room = roomService.createRoom(socket.id, nickname);
      socket.join(room.id);
      callback({ roomId: room.id });
      // Notify client with sync?
      socket.emit('room:sync', room);
    } catch (e) {
      console.error(e);
      // Callback with error? Protocol only has {roomId} in success?
      // MVP: ack is simple.
    }
  });

  socket.on('room:join', (roomId, nickname, callback) => {
    try {
      const result = roomService.joinRoom(roomId, socket.id, nickname);
      if (result.success) {
        socket.join(roomId);
        const room = roomService.getRoom(roomId);
        if (room) {
          // Broadcast to everyone in room including sender
          io.to(roomId).emit('room:sync', room);
        }
      }
      callback(result);
    } catch (e) {
      console.error(e);
      callback({ success: false, message: 'Server error' });
    }
  });
};
