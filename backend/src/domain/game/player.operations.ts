import type { Player, Room, ConnectionStatus, DisconnectedSession } from '@blue-banker/shared';
import { SESSION_EXPIRY_MS, KICK_GRACE_PERIOD_MS } from '../../utils/constants.js';

/**
 * Player 순수 함수 (연결 상태, 킥, 호스트 선출, 세션)
 */

export function updateConnectionStatus(player: Player, status: ConnectionStatus): void {
  player.connectionStatus = status;

  if (status === 'OFFLINE') {
    player.disconnectedAt = Date.now();
  } else if (status === 'ONLINE') {
    player.disconnectedAt = null;
  }
}

export function createDisconnectedSession(player: Player, roomId: string): DisconnectedSession {
  return {
    nickname: player.nickname,
    roomId,
    cash: player.cash,
    assetValue: player.assetValue,
    assets: [...player.assets],
    disconnectedAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    originalSocketId: player.id
  };
}

export function restoreSession(room: Room, nickname: string, newSocketId: string): Player | null {
  const existingPlayer = room.players.find(
    p => p.nickname === nickname && p.connectionStatus === 'OFFLINE'
  );
  if (!existingPlayer) return null;

  const oldSocketId = existingPlayer.id;

  existingPlayer.id = newSocketId;
  existingPlayer.connectionStatus = 'ONLINE';
  existingPlayer.connected = true;
  existingPlayer.disconnectedAt = null;

  if (room.hostId === oldSocketId) {
    room.hostId = newSocketId;
  }

  return existingPlayer;
}

export function isKickable(player: Player): boolean {
  if (player.connectionStatus !== 'OFFLINE') return false;
  if (!player.disconnectedAt) return false;

  const offlineTime = Date.now() - player.disconnectedAt;
  return offlineTime >= KICK_GRACE_PERIOD_MS;
}

export function migrateHost(room: Room, oldHostId: string): Player | null {
  const onlinePlayers = room.players.filter(
    p => p.connectionStatus === 'ONLINE' && p.id !== oldHostId
  );

  if (onlinePlayers.length === 0) {
    room.pendingHostMigration = false;
    return null;
  }

  const newHost = onlinePlayers[0];
  if (!newHost) {
    room.pendingHostMigration = false;
    return null;
  }

  const oldHost = room.players.find(p => p.id === oldHostId);
  if (oldHost) {
    oldHost.isHost = false;
  }

  newHost.isHost = true;
  room.hostId = newHost.id;
  room.pendingHostMigration = false;

  return newHost;
}
