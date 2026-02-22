import type { Room } from '@blue-banker/shared';

export interface IRoomRepository {
  save(room: Room): void;
  findById(id: string): Room | undefined;
  has(id: string): boolean;
  delete(id: string): void;
  entries(): IterableIterator<[string, Room]>;

  getPlayerRoomId(playerId: string): string | undefined;
  setPlayerRoomId(playerId: string, roomId: string): void;
  deletePlayerRoomId(playerId: string): void;

  setCreatorIp(roomId: string, ip: string): void;
  getCreatorIp(roomId: string): string | undefined;
  deleteCreatorIp(roomId: string): void;
  countRoomsByIp(ip: string): number;
}
