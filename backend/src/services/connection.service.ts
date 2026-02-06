import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, DisconnectedSession, ConnectionStatus, Room, Player } from '@blue-banker/shared';
import { store } from '../models/store.js';
import { SESSION_EXPIRY_MS, HOST_MIGRATION_DELAY_MS, KICK_GRACE_PERIOD_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';

/**
 * Connection Service - Manages player connection states and session recovery
 */
export const connectionService = {
  /**
   * Update player connection status (T015)
   */
  updateConnectionStatus(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomId: string,
    playerId: string,
    status: ConnectionStatus
  ): void {
    const room = store.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.connectionStatus = status;

    if (status === 'OFFLINE') {
      player.disconnectedAt = Date.now();
    } else if (status === 'ONLINE') {
      player.disconnectedAt = null;
    }

    // Broadcast connection status to all room players
    io.to(roomId).emit('connection:status', {
      playerId,
      status,
      nickname: player.nickname
    });
  },

  /**
   * Save disconnected session for later recovery (T023)
   */
  saveDisconnectedSession(player: Player, roomId: string): void {
    const session: DisconnectedSession = {
      nickname: player.nickname,
      roomId,
      cash: player.cash,
      assetValue: player.assetValue,
      assets: [...player.assets],
      disconnectedAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
      originalSocketId: player.id
    };

    store.disconnectedSessions.set(`${roomId}:${player.nickname}`, session);
  },

  /**
   * Find disconnected session by nickname and roomId (T024)
   */
  findDisconnectedSession(roomId: string, nickname: string): DisconnectedSession | undefined {
    const key = `${roomId}:${nickname}`;
    const session = store.disconnectedSessions.get(key);

    if (session && session.expiresAt > Date.now()) {
      return session;
    }

    // Session expired, remove it
    if (session) {
      store.disconnectedSessions.delete(key);
    }

    return undefined;
  },

  /**
   * Restore session for reconnecting player (T025)
   * room.players에서 기존 OFFLINE 플레이어를 직접 재활성화 (스냅샷 대신 실시간 데이터 사용)
   */
  restoreSession(roomId: string, nickname: string, newSocketId: string): Player | null {
    const room = store.rooms.get(roomId);
    if (!room) return null;

    // room.players에서 nickname으로 기존 OFFLINE 플레이어를 찾는다
    const existingPlayer = room.players.find(
      p => p.nickname === nickname && p.connectionStatus === 'OFFLINE'
    );
    if (!existingPlayer) return null;

    const oldSocketId = existingPlayer.id;

    // 기존 플레이어의 id를 새 socket.id로 교체
    existingPlayer.id = newSocketId;
    existingPlayer.connectionStatus = 'ONLINE';
    existingPlayer.connected = true;
    existingPlayer.disconnectedAt = null;

    // Update host ID if this was the host
    if (room.hostId === oldSocketId) {
      room.hostId = newSocketId;
    }

    // T026: playerToRoom 인덱스 갱신 (구 socket.id 삭제 → 새 socket.id 등록)
    store.playerToRoom.delete(oldSocketId);
    store.playerToRoom.set(newSocketId, roomId);

    // Remove session from storage
    store.disconnectedSessions.delete(`${roomId}:${nickname}`);

    return existingPlayer;
  },

  /**
   * Cleanup expired sessions (T026)
   * LOBBY/ENDED 상태 방에서는 OFFLINE 플레이어를 room.players에서 동기 제거
   * PLAYING 상태에서는 OFFLINE 유지 (호스트 킥 위임)
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, session] of store.disconnectedSessions.entries()) {
      if (session.expiresAt <= now) {
        store.disconnectedSessions.delete(key);
        cleaned++;

        // LOBBY/ENDED 상태 방에서는 해당 OFFLINE 플레이어를 room.players에서 제거
        const room = store.rooms.get(session.roomId);
        if (room && (room.status === 'LOBBY' || room.status === 'ENDED')) {
          const playerIndex = room.players.findIndex(
            p => p.nickname === session.nickname && p.connectionStatus === 'OFFLINE'
          );
          if (playerIndex !== -1) {
            const player = room.players[playerIndex];
            if (player) {
              store.playerToRoom.delete(player.id);
              store.playerNotifications.delete(player.id);
            }
            room.players.splice(playerIndex, 1);
          }

          // 빈 방 자동 정리
          if (room.players.length === 0) {
            store.cleanupRoom(room.id);
          }
        }

        // PLAYING 상태 방에서 모든 플레이어가 OFFLINE이고 세션이 전부 만료되면 방 자동 정리
        if (room && room.status === 'PLAYING') {
          const allOffline = room.players.every(p => p.connectionStatus === 'OFFLINE');
          if (allOffline) {
            // 해당 방의 세션이 남아있는지 확인
            const hasRemainingSession = Array.from(store.disconnectedSessions.values())
              .some(s => s.roomId === session.roomId && s.expiresAt > now);
            if (!hasRemainingSession) {
              store.cleanupRoom(room.id);
            }
          }
        }
      }
    }

    return cleaned;
  },

  /**
   * Start host migration timer (T034)
   */
  startHostMigrationTimer(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    room: Room,
    disconnectedHostId: string
  ): void {
    // Cancel existing timer if any
    this.cancelHostMigrationTimer(room.id);

    room.pendingHostMigration = true;

    // Notify all players
    io.to(room.id).emit('host:migrating', {
      disconnectedHostId,
      remainingSeconds: HOST_MIGRATION_DELAY_MS / 1000
    });

    // Set timer for host migration (TimerManager)
    timerManager.set(`${room.id}:host-migration`, () => {
      this.migrateHost(io, room);
    }, HOST_MIGRATION_DELAY_MS);
  },

  /**
   * Cancel host migration timer (T035)
   */
  cancelHostMigrationTimer(roomId: string): boolean {
    if (timerManager.has(`${roomId}:host-migration`)) {
      timerManager.clear(`${roomId}:host-migration`);

      const room = store.rooms.get(roomId);
      if (room) {
        room.pendingHostMigration = false;
      }

      return true;
    }
    return false;
  },

  /**
   * Migrate host to next available player (T036)
   */
  migrateHost(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    room: Room
  ): boolean {
    // 방 존재 여부 확인 (타이머 콜백 시 이미 삭제되었을 수 있음)
    if (!store.rooms.has(room.id)) {
      timerManager.clearByPrefix(`${room.id}:`);
      return false;
    }

    const oldHostId = room.hostId;

    // Find next host based on join order (first online player who isn't the old host)
    const onlinePlayers = room.players.filter(
      p => p.connectionStatus === 'ONLINE' && p.id !== oldHostId
    );

    if (onlinePlayers.length === 0) {
      room.pendingHostMigration = false;
      return false;
    }

    // First player in the list becomes new host
    const newHost = onlinePlayers[0];

    if (!newHost) {
        room.pendingHostMigration = false;
        return false;
    }

    // Update old host
    const oldHost = room.players.find(p => p.id === oldHostId);
    if (oldHost) {
      oldHost.isHost = false;
    }

    // Update new host
    newHost.isHost = true;
    room.hostId = newHost.id;
    room.pendingHostMigration = false;

    // Notify all players
    io.to(room.id).emit('host:migrated', {
      oldHostId,
      newHostId: newHost.id,
      newHostNickname: newHost.nickname
    });

    // Sync room state
    io.to(room.id).emit('room:sync', room);

    return true;
  },

  /**
   * Check if player can be kicked (5+ minutes offline) (T045)
   */
  isKickable(player: Player): boolean {
    if (player.connectionStatus !== 'OFFLINE') return false;
    if (!player.disconnectedAt) return false;

    const offlineTime = Date.now() - player.disconnectedAt;
    return offlineTime >= KICK_GRACE_PERIOD_MS;
  },

  /**
   * Kick player from room (T044)
   */
  kickPlayer(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    room: Room,
    playerId: string
  ): boolean {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    if (!this.isKickable(player)) return false;

    const nickname = player.nickname;

    // Remove player from room (assets are deleted - 자산 말소)
    room.players = room.players.filter(p => p.id !== playerId);

    // 인덱스 정리
    store.playerToRoom.delete(playerId);
    store.playerNotifications.delete(playerId);

    // Remove any pending session
    store.disconnectedSessions.delete(`${room.id}:${nickname}`);

    // Notify all players
    io.to(room.id).emit('player:kicked', {
      playerId,
      nickname
    });

    // Sync room state
    io.to(room.id).emit('room:sync', room);

    // 방에 플레이어가 0명이면 즉시 정리
    if (room.players.length === 0) {
      store.cleanupRoom(room.id);
    }

    return true;
  }
};
