import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import { connectionService } from '../services/connection.service.js';
import { store } from '../models/store.js';

/**
 * Connection Handler - Handles connection-related socket events
 */
export const registerConnectionHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  const getRoomId = (): string | null => {
    for (const room of store.rooms.values()) {
      if (room.players.some(p => p.id === socket.id)) {
        return room.id;
      }
    }
    return null;
  };

  // Handle disconnect event (T016, T027, T037)
  socket.on('disconnect', () => {
    const roomId = getRoomId();
    if (!roomId) return;

    const room = store.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Update connection status to OFFLINE
    connectionService.updateConnectionStatus(io, roomId, socket.id, 'OFFLINE');

    // Save session for potential reconnection (T027)
    connectionService.saveDisconnectedSession(player, roomId);

    // If disconnected player was host, start migration timer (T037)
    if (player.isHost) {
      connectionService.startHostMigrationTimer(io, room, socket.id);
    }

    // Sync room state
    io.to(roomId).emit('room:sync', room);

    console.log(`Player ${player.nickname} disconnected from room ${roomId}`);
  });

  // Handle heartbeat (T017 - keep connection alive)
  socket.on('connection:heartbeat', () => {
    const roomId = getRoomId();
    if (!roomId) return;

    const room = store.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.lastSeenAt = Date.now();
    }
  });

  // Handle room rejoin (T028)
  socket.on('room:rejoin', (roomId: string, nickname: string, callback) => {
    try {
      const room = store.rooms.get(roomId);
      if (!room) {
        callback({ success: false, message: '방을 찾을 수 없습니다' });
        return;
      }

      // Try to restore session
      const restoredPlayer = connectionService.restoreSession(roomId, nickname, socket.id);

      if (!restoredPlayer) {
        callback({ success: false, message: '세션이 만료되었습니다' });
        return;
      }

      // Join socket room
      socket.join(roomId);

      // Cancel host migration if this was the host (T038)
      if (restoredPlayer.isHost && room.pendingHostMigration) {
        connectionService.cancelHostMigrationTimer(roomId);
        io.to(roomId).emit('host:migration_cancelled', {
          hostId: restoredPlayer.id,
          hostNickname: restoredPlayer.nickname
        });
      }

      // Notify all players about rejoin
      io.to(roomId).emit('player:rejoined', {
        playerId: restoredPlayer.id,
        nickname: restoredPlayer.nickname
      });

      // Sync room state
      io.to(roomId).emit('room:sync', room);

      callback({ success: true });

      console.log(`Player ${nickname} rejoined room ${roomId}`);
    } catch (error: any) {
      callback({ success: false, message: error.message || '재접속 실패' });
    }
  });

  // Handle player kick (T046-T047)
  socket.on('player:kick', (playerId: string, callback) => {
    try {
      const roomId = getRoomId();
      if (!roomId) {
        callback({ success: false, message: '방을 찾을 수 없습니다' });
        return;
      }

      const room = store.rooms.get(roomId);
      if (!room) {
        callback({ success: false, message: '방을 찾을 수 없습니다' });
        return;
      }

      // Check if requester is host
      const requester = room.players.find(p => p.id === socket.id);
      if (!requester?.isHost) {
        callback({ success: false, message: '호스트만 퇴장시킬 수 있습니다' });
        return;
      }

      // Find target player
      const targetPlayer = room.players.find(p => p.id === playerId);
      if (!targetPlayer) {
        callback({ success: false, message: '플레이어를 찾을 수 없습니다' });
        return;
      }

      // Check if player is kickable (5+ minutes offline)
      if (!connectionService.isKickable(targetPlayer)) {
        callback({ success: false, message: '해당 플레이어는 아직 퇴장 대상이 아닙니다' });
        return;
      }

      // Kick the player
      const kicked = connectionService.kickPlayer(io, room, playerId);
      if (!kicked) {
        callback({ success: false, message: '퇴장 처리에 실패했습니다' });
        return;
      }

      callback({ success: true });

      console.log(`Player ${targetPlayer.nickname} was kicked from room ${roomId}`);
    } catch (error: any) {
      callback({ success: false, message: error.message || '퇴장 처리 실패' });
    }
  });
};
