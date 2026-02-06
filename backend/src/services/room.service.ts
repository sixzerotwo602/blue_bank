import { store } from '../models/store.js';
import type { Room, Player, Ranking } from '@blue-banker/shared';

export class RoomService {
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    do {
      result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (store.rooms.has(result));
    return result;
  }

  createRoom(hostId: string, nickname: string): Room {
    const roomId = this.generateRoomId();
    const host: Player = {
      id: hostId,
      nickname,
      cash: 0, // Initial cash? Configurable? Rules say 0 or start amount
      assetValue: 0,
      assets: [],
      roomId,
      isReady: false,
      isHost: true,
      connected: true,
      connectionStatus: 'ONLINE',
      disconnectedAt: null,
    };

    const room: Room = {
      id: roomId,
      status: 'LOBBY',
      players: [host],
      welfareFund: 0,
      hostId,
      createdAt: Date.now(),
    };

    store.rooms.set(roomId, room);
    // 인덱스 등록: 호스트를 playerToRoom에 추가
    store.playerToRoom.set(hostId, roomId);
    return room;
  }

  joinRoom(roomId: string, playerId: string, nickname: string): { success: boolean; message?: string } {
    const room = store.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }
    if (room.status !== 'LOBBY') {
      // Allow reconnect?
      const existing = room.players.find(p => p.id === playerId);
      if (existing) {
         // allow reconnect logic later?
      }
      // If we use UUID for player ID persisted in client, we can reconnect.
      // For MVP, usually socket.id is player.id. So reconnect is hard without tokens.
      // "One-time session" logic.
      return { success: false, message: 'Game already started' };
    }

    // Check nickname dup
    if (room.players.some(p => p.nickname === nickname)) {
       // Allow if it's me?
       return { success: false, message: 'Nickname taken' };
    }

    const player: Player = {
      id: playerId,
      nickname,
      cash: 0, // Rules?
      assetValue: 0,
      assets: [],
      roomId,
      isReady: false,
      isHost: false,
      connected: true,
      connectionStatus: 'ONLINE',
      disconnectedAt: null,
    };

    room.players.push(player);
    // 인덱스 등록: 플레이어를 playerToRoom에 추가
    store.playerToRoom.set(playerId, roomId);
    return { success: true };
  }

  getRoom(roomId: string): Room | undefined {
    return store.rooms.get(roomId);
  }

  /** 플레이어 목록으로 랭킹을 계산합니다 (Cash + AssetValue 기준 내림차순) */
  calculateRankings(players: Player[]): Ranking[] {
    const rankings: Ranking[] = players
      .map(p => ({
        id: p.id,
        nickname: p.nickname,
        cash: p.cash,
        assetValue: p.assetValue,
        totalAssets: p.cash + p.assetValue,
        rank: 0
      }))
      .sort((a, b) => b.totalAssets - a.totalAssets);
    rankings.forEach((r, index) => { r.rank = index + 1; });
    return rankings;
  }

  // Task 7.1: 자산명 수정
  renameAsset(roomId: string, playerId: string, assetId: string, newName: string): { success: boolean; error?: string; oldName?: string } {
    // 이름 검증
    if (!newName || newName.trim() === '') {
      return { success: false, error: '자산 이름은 비워둘 수 없습니다' };
    }
    if (newName.length > 20) {
      return { success: false, error: '자산 이름은 20자 이하여야 합니다' };
    }

    const room = store.rooms.get(roomId);
    if (!room) {
      return { success: false, error: '방을 찾을 수 없습니다' };
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: '플레이어를 찾을 수 없습니다' };
    }

    const asset = player.assets.find(a => a.id === assetId);
    if (!asset) {
      return { success: false, error: '자산을 찾을 수 없습니다' };
    }

    // 토지만 이름 변경 가능
    if (asset.type !== 'LAND') {
      return { success: false, error: '토지만 이름을 변경할 수 있습니다' };
    }

    const oldName = asset.name || '';
    asset.name = newName.trim();

    return { success: true, oldName };
  }
}

export const roomService = new RoomService();

