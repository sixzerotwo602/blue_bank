import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import { connectionService } from '../services/connection.service.js';
import { store } from '../models/store.js';
import { getRoomId } from '../utils/helpers.js';

/**
 * Connection Handler - Handles connection-related socket events
 */
export const registerConnectionHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {

  // Handle disconnect event (T016, T027, T037)
  socket.on('disconnect', () => {
    const roomId = getRoomId(socket.id);
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

  // Handle player kick (T046-T047)
  socket.on('player:kick', (playerId: string, callback) => {
    try {
      const roomId = getRoomId(socket.id);
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
