import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import type { GameUseCases } from '../application/game.use-cases.js';
import { getClientIp, isRoomMember } from '../utils/helpers.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';
import { MAX_ROOMS_PER_IP } from '../utils/constants.js';

export const registerRoomHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  gameUC: GameUseCases
) => {
  socket.on('room:create', (nickname, callback) => {
    try {
      const clientIp = getClientIp(socket);

      if (!rateLimiter.checkLimit(clientIp, 'ROOM_CREATE')) {
        return callback({ roomId: '' });
      }

      const v = validate<{ nickname: string }>('room:create', { nickname });

      if (gameUC.countRoomsByIp(clientIp) >= MAX_ROOMS_PER_IP) {
        return callback({ roomId: '' });
      }

      const room = gameUC.createRoom(socket.id, v.nickname);
      gameUC.setCreatorIp(room.id, clientIp);
      socket.join(room.id);
      callback({ roomId: room.id });
      socket.emit('room:sync', room);
    } catch (e: any) {
      callback({ roomId: '' });
    }
  });

  socket.on('room:join', (roomId, nickname, callback) => {
    try {
      const clientIp = getClientIp(socket);

      if (!rateLimiter.checkLimit(clientIp, 'ROOM_JOIN')) {
        return callback({ success: false, message: '요청이 너무 많습니다' });
      }

      const v = validate<{ roomId: string; nickname: string }>('room:join', { roomId, nickname });

      let result = gameUC.joinRoom(v.roomId, socket.id, v.nickname);

      if (!result.success && result.message === 'Game already started') {
        const restoredPlayer = gameUC.restoreSession(v.roomId, v.nickname, socket.id);
        if (restoredPlayer) {
          result = { success: true };
          io.to(v.roomId).emit('player:rejoined', {
            playerId: restoredPlayer.id,
            nickname: restoredPlayer.nickname
          });
        }
      }

      if (!result.success && result.message === 'Nickname taken') {
        const room = gameUC.getRoom(v.roomId);
        if (room) {
          const offlinePlayer = room.players.find(
            p => p.nickname === v.nickname && p.connectionStatus === 'OFFLINE'
          );
          if (offlinePlayer) {
            const restoredPlayer = gameUC.restoreSession(v.roomId, v.nickname, socket.id);
            if (restoredPlayer) {
              result = { success: true };
              io.to(v.roomId).emit('player:rejoined', {
                playerId: restoredPlayer.id,
                nickname: restoredPlayer.nickname
              });
            }
          }
        }
      }

      if (result.success) {
        socket.join(v.roomId);
        const room = gameUC.getRoom(v.roomId);
        if (room) {
          io.to(v.roomId).emit('room:sync', room);
        }
        callback(room ? { ...result, room } : result);
      } else {
        callback(result);
      }
    } catch (e: any) {
      callback({ success: false, message: e.message || 'Server error' });
    }
  });

  socket.on('room:get', (roomId, callback) => {
    try {
      const v = validate<{ roomId: string }>('room:get', { roomId });
      const room = gameUC.getRoom(v.roomId);
      if (room) {
        callback({ room });
      } else {
        callback({ error: 'Room not found' });
      }
    } catch (e: any) {
      callback({ error: e.message || 'Invalid room ID' });
    }
  });

  socket.on('asset:rename', (assetId: string, newName: string, callback) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'GENERAL')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ assetId: string; newName: string }>('asset:rename', { assetId, newName });

      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const room = gameUC.getRoom(roomId);
      if (!room || !isRoomMember(socket.id, room)) {
        return callback({ success: false, error: '방 멤버가 아닙니다' });
      }

      const result = gameUC.renameAsset(roomId, socket.id, v.assetId, v.newName);

      if (!result.success) {
        return callback({ success: false, error: result.error || '자산명 변경 실패' });
      }

      io.to(roomId).emit('asset:renamed', {
        playerId: socket.id,
        assetId: v.assetId,
        oldName: result.oldName || '',
        newName: v.newName
      });

      const updatedRoom = gameUC.getRoom(roomId);
      if (updatedRoom) {
        io.to(roomId).emit('room:sync', updatedRoom);
      }

      callback({ success: true });

    } catch (error: any) {
      callback({ success: false, error: error.message || '자산명 변경 실패' });
    }
  });
};
