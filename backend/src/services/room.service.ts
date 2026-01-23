import { store } from '../models/store.js';
import type { Room, Player } from '@blue-banker/shared';

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
      connectionStatus: 'ONLINE', // (T018) Initialize connection status
      lastSeenAt: Date.now(),      // (T018) Initialize last seen time
      disconnectedAt: null,        // (T018) Initialize disconnect time
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
      connectionStatus: 'ONLINE', // (T018) Initialize connection status
      lastSeenAt: Date.now(),      // (T018) Initialize last seen time
      disconnectedAt: null,        // (T018) Initialize disconnect time
    };

    room.players.push(player);
    return { success: true };
  }

  getRoom(roomId: string): Room | undefined {
    return store.rooms.get(roomId);
  }
}

export const roomService = new RoomService();

