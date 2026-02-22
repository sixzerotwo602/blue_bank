import type { Transaction, CancelRequest } from '@blue-banker/shared';

export interface ITransactionRepository {
  save(transaction: Transaction): void;
  findById(id: string): Transaction | undefined;
  findByRoomId(roomId: string): Transaction[];
  findByPlayerId(playerId: string): Transaction[];
  hasActiveWelfarePayout(): boolean;

  saveCancelRequest(request: CancelRequest): void;
  findCancelRequestById(id: string): CancelRequest | undefined;

  addToRoomIndex(roomId: string, txId: string): void;
}
