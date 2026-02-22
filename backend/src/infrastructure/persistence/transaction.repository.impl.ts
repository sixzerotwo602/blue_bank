import type { Transaction, CancelRequest } from '@blue-banker/shared';
import type { ITransactionRepository } from '../../domain/transaction/transaction.repository.js';
import type { MemoryStore } from './memory-store.js';

export class TransactionRepositoryImpl implements ITransactionRepository {
  constructor(private readonly store: MemoryStore) {}

  save(transaction: Transaction): void {
    this.store.transactions.set(transaction.id, transaction);
  }

  findById(id: string): Transaction | undefined {
    return this.store.transactions.get(id);
  }

  findByRoomId(roomId: string): Transaction[] {
    const txIds = this.store.roomTransactions.get(roomId);
    if (!txIds) return [];
    const result: Transaction[] = [];
    for (const txId of txIds) {
      const tx = this.store.transactions.get(txId);
      if (tx) result.push(tx);
    }
    return result;
  }

  findByPlayerId(playerId: string): Transaction[] {
    // 복지기금 기부 락 상태 포함
    const hasWelfareReceive = this.hasActiveWelfarePayout();

    return Array.from(this.store.transactions.values())
      .filter(tx => tx.fromId === playerId || tx.toId === playerId)
      .map(tx => {
        if (tx.type === 'DONATE' && tx.toId === 'FUND' && tx.status !== 'CANCELLED') {
          return { ...tx, locked: hasWelfareReceive };
        }
        return tx;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  hasActiveWelfarePayout(): boolean {
    for (const tx of this.store.transactions.values()) {
      if (tx.type === 'WELFARE_RECEIVE' && tx.status !== 'CANCELLED') {
        return true;
      }
    }
    return false;
  }

  saveCancelRequest(request: CancelRequest): void {
    this.store.cancelRequests.set(request.id, request);
  }

  findCancelRequestById(id: string): CancelRequest | undefined {
    return this.store.cancelRequests.get(id);
  }

  addToRoomIndex(roomId: string, txId: string): void {
    let txSet = this.store.roomTransactions.get(roomId);
    if (!txSet) {
      txSet = new Set();
      this.store.roomTransactions.set(roomId, txSet);
    }
    txSet.add(txId);
  }
}
