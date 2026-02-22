import type { Room, Player, Ranking, ConnectionStatus } from '@blue-banker/shared';
import type { IRoomRepository } from '../domain/game/room.repository.js';
import type { ISessionRepository } from '../domain/game/session.repository.js';
import {
  generateRoomId, createRoom, createPlayer, joinRoom,
  calculateRankings, renameAsset
} from '../domain/game/room.operations.js';
import {
  updateConnectionStatus, createDisconnectedSession,
  restoreSession, isKickable, migrateHost
} from '../domain/game/player.operations.js';
import { timerManager } from '../utils/timer-manager.js';

export class GameUseCases {
  constructor(
    private readonly roomRepo: IRoomRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly cleanupRoomFn: (roomId: string) => void
  ) {}

  // ─── 방 관리 ───

  createRoom(hostId: string, nickname: string): Room {
    const roomId = generateRoomId((id) => this.roomRepo.has(id));
    const room = createRoom(roomId, hostId, nickname);
    this.roomRepo.save(room);
    this.roomRepo.setPlayerRoomId(hostId, roomId);
    return room;
  }

  joinRoom(roomId: string, playerId: string, nickname: string): { success: boolean; message?: string } {
    const room = this.roomRepo.findById(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const player = createPlayer(playerId, nickname, roomId);
    const result = joinRoom(room, player);

    if (result.success) {
      this.roomRepo.setPlayerRoomId(playerId, roomId);
    }

    return result;
  }

  getRoom(roomId: string): Room | undefined {
    return this.roomRepo.findById(roomId);
  }

  getRoomId(playerId: string): string | null {
    return this.roomRepo.getPlayerRoomId(playerId) ?? null;
  }

  countRoomsByIp(ip: string): number {
    return this.roomRepo.countRoomsByIp(ip);
  }

  setCreatorIp(roomId: string, ip: string): void {
    this.roomRepo.setCreatorIp(roomId, ip);
  }

  // ─── 게임 관리 ───

  calculateRankings(players: Player[]): Ranking[] {
    return calculateRankings(players);
  }

  renameAsset(roomId: string, playerId: string, assetId: string, newName: string): { success: boolean; error?: string; oldName?: string } {
    const room = this.roomRepo.findById(roomId);
    if (!room) {
      return { success: false, error: '방을 찾을 수 없습니다' };
    }
    return renameAsset(room, playerId, assetId, newName);
  }

  // ─── 연결 관리 ───

  updateConnectionStatus(roomId: string, playerId: string, status: ConnectionStatus): Player | null {
    const room = this.roomRepo.findById(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    updateConnectionStatus(player, status);
    return player;
  }

  saveDisconnectedSession(player: Player, roomId: string): void {
    const session = createDisconnectedSession(player, roomId);
    this.sessionRepo.save(`${roomId}:${player.nickname}`, session);
  }

  restoreSession(roomId: string, nickname: string, newSocketId: string): Player | null {
    const room = this.roomRepo.findById(roomId);
    if (!room) return null;

    const oldPlayer = room.players.find(
      p => p.nickname === nickname && p.connectionStatus === 'OFFLINE'
    );
    const oldSocketId = oldPlayer?.id;

    const restoredPlayer = restoreSession(room, nickname, newSocketId);
    if (!restoredPlayer) return null;

    // 인덱스 갱신
    if (oldSocketId) {
      this.roomRepo.deletePlayerRoomId(oldSocketId);
    }
    this.roomRepo.setPlayerRoomId(newSocketId, roomId);

    // 세션 삭제
    this.sessionRepo.delete(`${roomId}:${nickname}`);

    return restoredPlayer;
  }

  isKickable(player: Player): boolean {
    return isKickable(player);
  }

  kickPlayer(room: Room, playerId: string): { kicked: boolean; nickname?: string } {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return { kicked: false };

    if (!isKickable(player)) return { kicked: false };

    const nickname = player.nickname;

    room.players = room.players.filter(p => p.id !== playerId);
    this.roomRepo.deletePlayerRoomId(playerId);

    // 세션 삭제
    this.sessionRepo.delete(`${room.id}:${nickname}`);

    return { kicked: true, nickname };
  }

  // ─── 호스트 마이그레이션 ───

  migrateHost(room: Room): Player | null {
    if (!this.roomRepo.has(room.id)) {
      timerManager.clearByPrefix(`${room.id}:`);
      return null;
    }

    const oldHostId = room.hostId;
    return migrateHost(room, oldHostId);
  }

  cancelHostMigration(roomId: string): boolean {
    if (timerManager.has(`${roomId}:host-migration`)) {
      timerManager.clear(`${roomId}:host-migration`);

      const room = this.roomRepo.findById(roomId);
      if (room) {
        room.pendingHostMigration = false;
      }

      return true;
    }
    return false;
  }

  // ─── 세션 정리 ───

  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, session] of this.sessionRepo.entries()) {
      if (session.expiresAt <= now) {
        this.sessionRepo.delete(key);
        cleaned++;

        const room = this.roomRepo.findById(session.roomId);
        if (room && (room.status === 'LOBBY' || room.status === 'ENDED')) {
          const playerIndex = room.players.findIndex(
            p => p.nickname === session.nickname && p.connectionStatus === 'OFFLINE'
          );
          if (playerIndex !== -1) {
            const player = room.players[playerIndex];
            if (player) {
              this.roomRepo.deletePlayerRoomId(player.id);
            }
            room.players.splice(playerIndex, 1);
          }

          if (room.players.length === 0) {
            this.cleanupRoom(room.id);
          }
        }

        if (room && room.status === 'PLAYING') {
          const allOffline = room.players.every(p => p.connectionStatus === 'OFFLINE');
          if (allOffline) {
            const hasRemainingSession = Array.from(this.sessionRepo.entries())
              .some(([, s]) => s.roomId === session.roomId && s.expiresAt > now);
            if (!hasRemainingSession) {
              this.cleanupRoom(room.id);
            }
          }
        }
      }
    }

    return cleaned;
  }

  cleanupRoom(roomId: string): void {
    this.cleanupRoomFn(roomId);
  }

  cleanupExpiredRooms(maxAgeMs: number): void {
    const now = Date.now();
    for (const [roomId, room] of this.roomRepo.entries()) {
      if (now - room.createdAt > maxAgeMs) {
        this.cleanupRoom(roomId);
      }
    }
  }
}
