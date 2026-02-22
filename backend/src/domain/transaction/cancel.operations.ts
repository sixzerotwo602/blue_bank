import type { Transaction, CancelRequest, Room } from '@blue-banker/shared';
import { randomUUID } from 'crypto';
import { CANCEL_REQUEST_TIMEOUT_MS, CANCEL_TIME_LIMIT_MS } from '../../utils/constants.js';

/**
 * 거래 취소 규칙 검증 + 실행 순수 함수
 */

export type CancelValidationResult = {
  ok: true;
  immediateCancel: boolean;
  request?: CancelRequest;
} | {
  ok: false;
  error: string;
}

export function validateCancelRequest(
  transaction: Transaction,
  room: Room,
  requesterId: string,
  hasWelfarePayout: boolean
): CancelValidationResult {
  if (transaction.fromId !== requesterId) return { ok: false, error: '본인의 거래만 취소할 수 있습니다' };
  if (transaction.status === 'CANCELLED') return { ok: false, error: '이미 취소된 거래입니다' };

  const elapsed = Date.now() - transaction.timestamp;
  if (elapsed > CANCEL_TIME_LIMIT_MS) {
    return { ok: false, error: '거래 취소 가능 시간이 만료되었습니다 (2분 초과)' };
  }

  // 복지기금 기부 락 검증
  if (transaction.type === 'DONATE' && transaction.toId === 'FUND') {
    if (hasWelfarePayout) {
      return { ok: false, error: '이미 사용된 기부금은 취소할 수 없습니다 (복지기금 수령 발생)' };
    }
  }

  // BUY_ASSET 취소 시 토지 위에 건물이 있으면 취소 불가
  if (transaction.type === 'BUY_ASSET') {
    const player = room.players.find(p => p.id === requesterId);
    if (player) {
      const asset = player.assets.find(
        a => a.value === transaction.amount &&
             Math.abs(a.createdAt - transaction.timestamp) < 5000
      );

      if (asset && asset.type === 'LAND') {
        const hasBuilding = player.assets.some(
          a => a.type === 'BUILDING' && a.landId === asset.id
        );
        if (hasBuilding) {
          return { ok: false, error: '토지 위에 건물이 있어 취소할 수 없습니다. 건물을 먼저 매각해주세요.' };
        }
      }
    }
  }

  // 은행/복지기금 거래는 즉시 취소
  if (transaction.toId === 'BANK' || transaction.toId === 'FUND') {
    return { ok: true, immediateCancel: true };
  }

  // 플레이어 간 거래: 상대방 동의 필요
  const targetPlayer = room.players.find(p => p.id === transaction.toId);
  if (!targetPlayer) return { ok: false, error: '상대방을 찾을 수 없습니다' };

  const remainingTime = CANCEL_TIME_LIMIT_MS - elapsed;
  const expiresIn = Math.min(CANCEL_REQUEST_TIMEOUT_MS, remainingTime);

  const request: CancelRequest = {
    id: randomUUID(),
    transactionId: transaction.id,
    requesterId,
    targetId: transaction.toId as string,
    status: 'PENDING',
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresIn
  };

  return { ok: true, immediateCancel: false, request };
}

export function executeCancelTransaction(
  transaction: Transaction,
  room: Room,
  cancelledBy: string
): Transaction | { error: string } {
  if (transaction.status === 'CANCELLED') return { error: '이미 취소된 거래입니다' };

  // 발신자에게 돈 반환
  const fromPlayer = room.players.find(p => p.id === transaction.fromId);
  if (fromPlayer) {
    fromPlayer.cash += transaction.amount;

    // BUY_ASSET 취소 시 자산 반납
    if (transaction.type === 'BUY_ASSET') {
      const assetToRemove = fromPlayer.assets.find(
        a => a.value === transaction.amount &&
             Math.abs(a.createdAt - transaction.timestamp) < 5000
      );

      if (assetToRemove) {
        fromPlayer.assets = fromPlayer.assets.filter(a => a.id !== assetToRemove.id);
        fromPlayer.assetValue -= assetToRemove.value;
      }
    }
  }

  // 수신자로부터 차감 (플레이어인 경우만)
  if (transaction.toId !== 'BANK' && transaction.toId !== 'FUND') {
    const toPlayer = room.players.find(p => p.id === transaction.toId);
    if (toPlayer) {
      if (toPlayer.cash < transaction.amount) {
        if (fromPlayer) fromPlayer.cash -= transaction.amount;
        return { error: '수신자의 잔액이 부족하여 취소할 수 없습니다' };
      }
      toPlayer.cash -= transaction.amount;
    }
  } else if (transaction.toId === 'FUND') {
    if (room.welfareFund < transaction.amount) {
      if (fromPlayer) fromPlayer.cash -= transaction.amount;
      return { error: '복지기금 잔액이 부족하여 취소할 수 없습니다' };
    }
    room.welfareFund -= transaction.amount;
  }

  transaction.status = 'CANCELLED';
  transaction.cancelledAt = Date.now();
  transaction.cancelledBy = cancelledBy;

  return transaction;
}

export function respondCancelRequest(
  request: CancelRequest,
  responderId: string,
  approve: boolean
): CancelRequest | { error: string } {
  if (request.targetId !== responderId) return { error: '해당 요청에 응답할 권한이 없습니다' };
  if (request.status !== 'PENDING') return { error: '이미 처리된 요청입니다' };
  if (Date.now() > request.expiresAt) return { error: '요청이 만료되었습니다' };

  request.status = approve ? 'APPROVED' : 'REJECTED';
  request.respondedAt = Date.now();

  return request;
}
