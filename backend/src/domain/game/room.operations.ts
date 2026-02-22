import type { Room, Player, Ranking } from '@blue-banker/shared';

/**
 * Room 어그리게이트 순수 함수
 */

const ROOM_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateRoomId(existsCheck: (id: string) => boolean): string {
  let result = '';
  do {
    result = '';
    for (let i = 0; i < 6; i++) {
      result += ROOM_ID_CHARS.charAt(Math.floor(Math.random() * ROOM_ID_CHARS.length));
    }
  } while (existsCheck(result));
  return result;
}

export function createRoom(roomId: string, hostId: string, nickname: string): Room {
  const host: Player = {
    id: hostId,
    nickname,
    cash: 0,
    assetValue: 0,
    assets: [],
    roomId,
    isReady: false,
    isHost: true,
    connected: true,
    connectionStatus: 'ONLINE',
    disconnectedAt: null,
  };

  return {
    id: roomId,
    status: 'LOBBY',
    players: [host],
    welfareFund: 0,
    hostId,
    createdAt: Date.now(),
  };
}

export function createPlayer(playerId: string, nickname: string, roomId: string): Player {
  return {
    id: playerId,
    nickname,
    cash: 0,
    assetValue: 0,
    assets: [],
    roomId,
    isReady: false,
    isHost: false,
    connected: true,
    connectionStatus: 'ONLINE',
    disconnectedAt: null,
  };
}

export function joinRoom(room: Room, player: Player): { success: boolean; message?: string } {
  if (room.status !== 'LOBBY') {
    const existing = room.players.find(p => p.id === player.id);
    if (!existing) {
      return { success: false, message: 'Game already started' };
    }
  }

  if (room.players.some(p => p.nickname === player.nickname)) {
    return { success: false, message: 'Nickname taken' };
  }

  room.players.push(player);
  return { success: true };
}

export function calculateRankings(players: Player[]): Ranking[] {
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

export function renameAsset(room: Room, playerId: string, assetId: string, newName: string): { success: boolean; error?: string; oldName?: string } {
  if (!newName || newName.trim() === '') {
    return { success: false, error: '자산 이름은 비워둘 수 없습니다' };
  }
  if (newName.length > 20) {
    return { success: false, error: '자산 이름은 20자 이하여야 합니다' };
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: '플레이어를 찾을 수 없습니다' };
  }

  const asset = player.assets.find(a => a.id === assetId);
  if (!asset) {
    return { success: false, error: '자산을 찾을 수 없습니다' };
  }

  if (asset.type !== 'LAND') {
    return { success: false, error: '토지만 이름을 변경할 수 있습니다' };
  }

  const oldName = asset.name || '';
  asset.name = newName.trim();

  return { success: true, oldName };
}
