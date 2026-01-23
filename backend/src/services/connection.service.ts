import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, DisconnectedSession, ConnectionStatus, Room, Player } from '@blue-banker/shared';
import { store } from '../models/store.js';

// Grace period: 5 minutes
const GRACE_PERIOD_MS = 5 * 60 * 1000;
// Host migration delay: 2 minutes
const HOST_MIGRATION_DELAY_MS = 2 * 60 * 1000;

// Host migration timers (roomId -> timeout)
const hostMigrationTimers: Map<string, NodeJS.Timeout> = new Map();

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
    player.lastSeenAt = Date.now();

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
      expiresAt: Date.now() + GRACE_PERIOD_MS,
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
   */
  restoreSession(roomId: string, nickname: string, newSocketId: string): Player | null {
    const session = this.findDisconnectedSession(roomId, nickname);
    if (!session) return null;

    const room = store.rooms.get(roomId);
    if (!room) return null;

    // Create restored player
    const restoredPlayer: Player = {
      id: newSocketId,
      nickname: session.nickname,
      cash: session.cash,
      assetValue: session.assetValue,
      assets: session.assets,
      roomId,
      isReady: true,
      isHost: room.hostId === session.originalSocketId,
      connected: true,
      connectionStatus: 'ONLINE',
      lastSeenAt: Date.now(),
      disconnectedAt: null
    };

    // Update host ID if this was the host
    if (room.hostId === session.originalSocketId) {
      room.hostId = newSocketId;
    }

    // Remove old player entry and add restored one
    room.players = room.players.filter(p => p.nickname !== nickname);
    room.players.push(restoredPlayer);

    // Remove session from storage
    store.disconnectedSessions.delete(`${roomId}:${nickname}`);

    return restoredPlayer;
  },

  /**
   * Cleanup expired sessions (T026)
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, session] of store.disconnectedSessions.entries()) {
      if (session.expiresAt <= now) {
        store.disconnectedSessions.delete(key);
        cleaned++;
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

    // Set timer for host migration
    const timer = setTimeout(() => {
      this.migrateHost(io, room);
      hostMigrationTimers.delete(room.id);
    }, HOST_MIGRATION_DELAY_MS);

    hostMigrationTimers.set(room.id, timer);
  },

  /**
   * Cancel host migration timer (T035)
   */
  cancelHostMigrationTimer(roomId: string): boolean {
    const timer = hostMigrationTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      hostMigrationTimers.delete(roomId);

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
    return offlineTime >= GRACE_PERIOD_MS; // 5 minutes
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

    // Remove any pending session
    store.disconnectedSessions.delete(`${room.id}:${nickname}`);

    // Notify all players
    io.to(room.id).emit('player:kicked', {
      playerId,
      nickname
    });

    // Sync room state
    io.to(room.id).emit('room:sync', room);

    return true;
  }
};
