import type { Room } from '@blue-banker/shared';
import type { IRoomRepository } from '../../domain/game/room.repository.js';
import type { MemoryStore } from './memory-store.js';

export class RoomRepositoryImpl implements IRoomRepository {
  constructor(private readonly store: MemoryStore) {}

  save(room: Room): void {
    this.store.rooms.set(room.id, room);
  }

  findById(id: string): Room | undefined {
    return this.store.rooms.get(id);
  }

  has(id: string): boolean {
    return this.store.rooms.has(id);
  }

  delete(id: string): void {
    this.store.rooms.delete(id);
  }

  entries(): IterableIterator<[string, Room]> {
    return this.store.rooms.entries();
  }

  getPlayerRoomId(playerId: string): string | undefined {
    return this.store.playerToRoom.get(playerId);
  }

  setPlayerRoomId(playerId: string, roomId: string): void {
    this.store.playerToRoom.set(playerId, roomId);
  }

  deletePlayerRoomId(playerId: string): void {
    this.store.playerToRoom.delete(playerId);
  }

  setCreatorIp(roomId: string, ip: string): void {
    this.store.roomCreatorIps.set(roomId, ip);
  }

  getCreatorIp(roomId: string): string | undefined {
    return this.store.roomCreatorIps.get(roomId);
  }

  deleteCreatorIp(roomId: string): void {
    this.store.roomCreatorIps.delete(roomId);
  }

  countRoomsByIp(ip: string): number {
    let count = 0;
    for (const creatorIp of this.store.roomCreatorIps.values()) {
      if (creatorIp === ip) count++;
    }
    return count;
  }
}
