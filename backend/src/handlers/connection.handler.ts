import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import type { GameUseCases } from '../application/game.use-cases.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';
import { timerManager } from '../utils/timer-manager.js';
import { HOST_MIGRATION_DELAY_MS } from '../utils/constants.js';

export const registerConnectionHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  gameUC: GameUseCases
) => {

  socket.on('disconnect', () => {
    rateLimiter.clear(socket.id);

    const roomId = gameUC.getRoomId(socket.id);
    if (!roomId) return;

    const room = gameUC.getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    gameUC.updateConnectionStatus(roomId, socket.id, 'OFFLINE');

    io.to(roomId).emit('connection:status', {
      playerId: socket.id,
      status: 'OFFLINE',
      nickname: player.nickname
    });

    gameUC.saveDisconnectedSession(player, roomId);

    if (player.isHost) {
      gameUC.cancelHostMigration(roomId);
      room.pendingHostMigration = true;

      io.to(roomId).emit('host:migrating', {
        disconnectedHostId: socket.id,
        remainingSeconds: HOST_MIGRATION_DELAY_MS / 1000
      });

      timerManager.set(`${roomId}:host-migration`, () => {
        const newHost = gameUC.migrateHost(room);
        if (newHost) {
          io.to(roomId).emit('host:migrated', {
            oldHostId: socket.id,
            newHostId: newHost.id,
            newHostNickname: newHost.nickname
          });
          io.to(roomId).emit('room:sync', room);
        }
      }, HOST_MIGRATION_DELAY_MS);
    }

    io.to(roomId).emit('room:sync', room);

    console.log(`Player ${player.nickname} disconnected from room ${roomId}`);
  });

  socket.on('player:kick', (playerId: string, callback) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'GENERAL')) {
        return callback({ success: false, message: '요청이 너무 많습니다' });
      }

      const v = validate<{ playerId: string }>('player:kick', { playerId });

      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) {
        callback({ success: false, message: '방을 찾을 수 없습니다' });
        return;
      }

      const room = gameUC.getRoom(roomId);
      if (!room) {
        callback({ success: false, message: '방을 찾을 수 없습니다' });
        return;
      }

      const requester = room.players.find(p => p.id === socket.id);
      if (!requester?.isHost) {
        callback({ success: false, message: '호스트만 퇴장시킬 수 있습니다' });
        return;
      }

      const targetPlayer = room.players.find(p => p.id === v.playerId);
      if (!targetPlayer) {
        callback({ success: false, message: '플레이어를 찾을 수 없습니다' });
        return;
      }

      if (!gameUC.isKickable(targetPlayer)) {
        callback({ success: false, message: '해당 플레이어는 아직 퇴장 대상이 아닙니다' });
        return;
      }

      const { kicked, nickname } = gameUC.kickPlayer(room, v.playerId);
      if (!kicked) {
        callback({ success: false, message: '퇴장 처리에 실패했습니다' });
        return;
      }

      io.to(roomId).emit('player:kicked', {
        playerId: v.playerId,
        nickname: nickname || ''
      });
      io.to(roomId).emit('room:sync', room);

      if (room.players.length === 0) {
        gameUC.cleanupRoom(roomId);
      }

      callback({ success: true });

      console.log(`Player ${nickname} was kicked from room ${roomId}`);
    } catch (error: any) {
      callback({ success: false, message: error.message || '퇴장 처리 실패' });
    }
  });
};
