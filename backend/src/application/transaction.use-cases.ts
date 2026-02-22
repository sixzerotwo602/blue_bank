import type { Transaction, TransactionType, CancelRequest, Room } from '@blue-banker/shared';
import type { ITransactionRepository } from '../domain/transaction/transaction.repository.js';
import { processTransaction } from '../domain/transaction/transaction.operations.js';
import { validateCancelRequest, executeCancelTransaction, respondCancelRequest } from '../domain/transaction/cancel.operations.js';

export class TransactionUseCases {
  constructor(private readonly txRepo: ITransactionRepository) {}

  process(
    room: Room,
    requesterId: string,
    payload: {
      type: TransactionType;
      amount: number;
      toId?: string;
      assetType?: 'LAND' | 'BUILDING';
      buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA';
      landName?: string;
      selectedLandId?: string;
      villaCount?: number;
      reason?: string;
      bundleSell?: boolean;
    }
  ): Transaction {
    const transaction = processTransaction(room, requesterId, payload);
    this.txRepo.save(transaction);
    this.txRepo.addToRoomIndex(room.id, transaction.id);
    return transaction;
  }

  getTransaction(transactionId: string): Transaction | undefined {
    return this.txRepo.findById(transactionId);
  }

  getPlayerTransactions(playerId: string): Transaction[] {
    return this.txRepo.findByPlayerId(playerId);
  }

  requestCancel(room: Room, transactionId: string, requesterId: string): CancelRequest | { error: string } {
    const transaction = this.txRepo.findById(transactionId);
    if (!transaction) return { error: '거래를 찾을 수 없습니다' };

    const hasWelfarePayout = this.txRepo.hasActiveWelfarePayout();
    const result = validateCancelRequest(transaction, room, requesterId, hasWelfarePayout);

    if (!result.ok) return { error: result.error };

    if (result.immediateCancel) {
      const cancelResult = executeCancelTransaction(transaction, room, requesterId);
      if ('error' in cancelResult) return cancelResult;

      return {
        id: `cancel-${transactionId}`,
        transactionId,
        requesterId,
        targetId: transaction.toId as string,
        status: 'APPROVED',
        createdAt: Date.now(),
        expiresAt: Date.now()
      } as CancelRequest;
    }

    // 플레이어 간 거래: 상대방 동의 필요
    if (result.request) {
      this.txRepo.saveCancelRequest(result.request);
      return result.request;
    }

    return { error: '취소 요청을 생성할 수 없습니다' };
  }

  expireCancelRequest(requestId: string): CancelRequest | undefined {
    const request = this.txRepo.findCancelRequestById(requestId);
    if (request && request.status === 'PENDING') {
      request.status = 'EXPIRED';
      return request;
    }
    return undefined;
  }

  respondCancel(room: Room, requestId: string, responderId: string, approve: boolean): CancelRequest | { error: string } {
    const request = this.txRepo.findCancelRequestById(requestId);
    if (!request) return { error: '취소 요청을 찾을 수 없습니다' };

    const respondResult = respondCancelRequest(request, responderId, approve);
    if ('error' in respondResult) return respondResult;

    if (approve) {
      const transaction = this.txRepo.findById(request.transactionId);
      if (transaction) {
        executeCancelTransaction(transaction, room, request.requesterId);
      }
    }

    return respondResult;
  }
}
