import { Server, Socket } from 'socket.io';
import { roomService } from '../services/room.service.js';
import { connectionService } from '../services/connection.service.js';
import { store } from '../models/store.js';
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
      // 1. Try normal join
      let result = roomService.joinRoom(roomId, socket.id, nickname);

      // 2. If failed because game started, try reconnection
      if (!result.success && result.message === 'Game already started') {
        const restoredPlayer = connectionService.restoreSession(roomId, nickname, socket.id);
        if (restoredPlayer) {
          result = { success: true };
          // Notify others about rejoin (optional, or just rely on sync)
          io.to(roomId).emit('player:rejoined', {
            playerId: restoredPlayer.id,
            nickname: restoredPlayer.nickname
          });
        }
      }

      // 3. Handle success (either new join or reconnection)
      if (result.success) {
        socket.join(roomId);
        const room = roomService.getRoom(roomId);
        if (room) {
          // Broadcast to everyone in room including sender
          io.to(roomId).emit('room:sync', room);
        }
      }
      callback(result);
    } catch (e: unknown) {
      console.error(e);
      callback({ success: false, message: 'Server error' });
    }
  });

  socket.on('room:get', (roomId, callback) => {
      const room = roomService.getRoom(roomId);
      if (room) {
          callback({ room });
      } else {
          callback({ error: 'Room not found' });
      }
  });

  // Task 7.2: 자산명 수정 핸들러
  socket.on('asset:rename', (assetId: string, newName: string, callback) => {
    try {
      // 플레이어가 속한 방 찾기
      let roomId: string | null = null;
      for (const room of store.rooms.values()) {
        if (room.players.some(p => p.id === socket.id)) {
          roomId = room.id;
          break;
        }
      }

      if (!roomId) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const result = roomService.renameAsset(roomId, socket.id, assetId, newName);

      if (!result.success) {
        return callback({ success: false, error: result.error || '자산명 변경 실패' });
      }

      // 모든 플레이어에게 알림
      io.to(roomId).emit('asset:renamed', {
        playerId: socket.id,
        assetId,
        oldName: result.oldName || '',
        newName
      });

      // 방 상태 동기화
      const room = roomService.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('room:sync', room);
      }

      callback({ success: true });

    } catch (error: any) {
      callback({ success: false, error: error.message || '자산명 변경 실패' });
    }
  });
};

