import type { Transaction, TransactionType, Asset, CancelRequest } from '@blue-banker/shared';
import { store } from '../models/store.js';
import { randomUUID } from 'crypto';

export class TransactionService {
  processTransaction(
    roomId: string,
    requesterId: string,
    payload: {
      type: TransactionType;
      amount: number;
      toId?: string;
      assetType?: 'LAND' | 'BUILDING';
      buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA'; // T004: Building type
      landName?: string; // T021: 토지 매입 시 토지명
      selectedLandId?: string; // T022: 건물 매입 시 토지 ID
      villaCount?: number; // T023: 별장 갯수 (1 또는 2)
      reason?: string; // T008: 은행 수령 사유 (BANK_RECEIVE)
      bundleSell?: boolean; // Task 4.2: 토지+건물 일괄 매각
    }
  ): Transaction {
    const room = store.rooms.get(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다');

    const player = room.players.find(p => p.id === requesterId);
    if (!player) throw new Error('플레이어를 찾을 수 없습니다');

    // SELL_ASSET은 금액을 백엔드에서 계산하므로 검증 제외
    if (payload.type !== 'SELL_ASSET' && payload.amount <= 0) {
      throw new Error('금액은 0보다 커야 합니다');
    }

    let fromId: string | 'BANK' | 'FUND' = requesterId;
    let toId: string | 'BANK' | 'FUND' = 'BANK';
    let txDescription: string | undefined;

    switch (payload.type) {
      case 'TRANSFER': {
        if (!payload.toId) throw new Error('받는 사람을 선택해주세요');
        const recipient = room.players.find(p => p.id === payload.toId);
        if (!recipient) throw new Error('받는 사람을 찾을 수 없습니다');
        
        if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
        
        player.cash -= payload.amount;
        recipient.cash += payload.amount;
        
        fromId = player.id;
        toId = recipient.id;
        break;
      }

      case 'BUY_ASSET': {
        if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
        const type = payload.assetType || 'LAND';
        const buildingType = type === 'BUILDING' ? (payload.buildingType || 'BUILDING') : undefined;

        let name: string;
        let description: string | undefined;

        if (type === 'LAND') {
          // T021: 토지 매입 - 사용자 입력 토지명 사용
          name = payload.landName?.trim() || `토지 #${player.assets.filter(a => a.type === 'LAND').length + 1}`;
          description = `토지 '${name}' 매입`;
        } else {
          // T022-T023: 건물 매입 - 선택한 토지 위에 건물 생성
          const selectedLand = player.assets.find(a => a.id === payload.selectedLandId);
          const landNameStr = selectedLand?.name || '토지';

          switch (buildingType) {
            case 'HOTEL':
              name = `${landNameStr} 호텔`;
              description = `'${landNameStr}' 토지 위에 호텔 건설`;
              break;
            case 'VILLA': {
              // 별장 번호 계산 (같은 토지 위 별장 개수 + 1)
              const villaCount = payload.villaCount || 1;
              const existingVillasOnLand = player.assets.filter(
                a => a.buildingType === 'VILLA' && a.name?.startsWith(`${landNameStr} 별장`)
              ).length;
              name = `${landNameStr} 별장${existingVillasOnLand + 1}`;
              description = `'${landNameStr}' 토지 위에 별장 ${villaCount}개 건설`;
              break;
            }
            default:
              name = `${landNameStr} 빌딩`;
              description = `'${landNameStr}' 토지 위에 빌딩 건설`;
              break;
          }
        }

        player.cash -= payload.amount;
        player.assetValue += payload.amount;
        const newAsset: Asset = {
            id: randomUUID(),
            type,
            name,
            value: payload.amount,
            createdAt: Date.now()
        };
        // T004: Store building type only when defined
        if (buildingType) {
            newAsset.buildingType = buildingType;
        }
        // Task 4.2 fix: 건물 생성 시 landId 연결
        if (type === 'BUILDING' && payload.selectedLandId) {
            newAsset.landId = payload.selectedLandId;
        }
        player.assets.push(newAsset);

        fromId = player.id;
        toId = 'BANK';
        txDescription = description;
        break;
      }

      case 'PAY_COST':
        if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
        player.cash -= payload.amount;
        fromId = player.id;
        toId = 'BANK';
        break;

      case 'DONATE':
        if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
        player.cash -= payload.amount;
        room.welfareFund += payload.amount;
        fromId = player.id;
        toId = 'FUND';
        break;

      case 'SALARY':
        player.cash += payload.amount;
        fromId = 'BANK';
        toId = player.id;
        break;

      case 'WELFARE_RECEIVE':
          // Allowing direct receive for now if client requests it (e.g. dev mode or simplified)
          // Ideally this comes from VoteService.
          if (room.welfareFund < payload.amount) throw new Error('복지기금이 부족합니다');
          room.welfareFund -= payload.amount;
          player.cash += payload.amount;
          fromId = 'FUND';
          toId = player.id;
          break;

      // T014: 은행 수령 (복권, 우승상금, 보너스 등) - 개인화
      // 모든 플레이어가 본인 계좌로 직접 수령 가능
      case 'BANK_RECEIVE': {
        // 본인 계좌로만 수령 가능 (toId가 있더라도 본인만 허용)
        const targetId = payload.toId || requesterId;
        if (targetId !== requesterId) {
          throw new Error('본인 계좌로만 수령할 수 있습니다');
        }

        player.cash += payload.amount;
        fromId = 'BANK';
        toId = player.id;
        
        // T008: reason에 따른 한글 상세 설명 생성
        const reasonLabels: Record<string, string> = {
          LOTTERY: '복권 당첨',
          PRIZE: '우승 상금',
          BONUS: '보너스',
          OTHER: '기타'
        };
        const reasonLabel = reasonLabels[payload.reason || ''] || '은행 지급';
        txDescription = reasonLabel;
        break;
      }

      // T044: 자산 매각 (50% 현금화)
      // Task 4.2: bundleSell 옵션으로 토지+건물 일괄 매각
      case 'SELL_ASSET': {
        if (!payload.toId) throw new Error('매각할 자산을 선택해주세요');
        const assetIndex = player.assets.findIndex(a => a.id === payload.toId);
        if (assetIndex === -1) throw new Error('자산을 찾을 수 없습니다');

        const asset = player.assets[assetIndex]!;
        let totalValue = asset.value;
        const soldAssetNames: string[] = [asset.name || '자산'];

        // Task 4.2: 토지 매각 시 건물 일괄 처리
        if (asset.type === 'LAND' && payload.bundleSell) {
          // 토지 위의 모든 건물 찾기
          const buildingsOnLand = player.assets.filter(
            a => a.type === 'BUILDING' && a.landId === asset.id
          );

          // 건물 가치 합산 및 이름 수집
          for (const building of buildingsOnLand) {
            totalValue += building.value;
            soldAssetNames.push(building.name || '건물');
          }

          // 건물 먼저 제거 (역순으로 제거하여 인덱스 문제 방지)
          const buildingIds = buildingsOnLand.map(b => b.id);
          player.assets = player.assets.filter(a => !buildingIds.includes(a.id));
        }

        const sellPrice = Math.floor(totalValue * 0.5); // 50% 현금화

        // 자산 제거 (토지 또는 단일 자산)
        const updatedAssetIndex = player.assets.findIndex(a => a.id === payload.toId);
        if (updatedAssetIndex !== -1) {
          player.assets.splice(updatedAssetIndex, 1);
        }
        player.assetValue -= totalValue;

        // 현금 지급
        player.cash += sellPrice;

        fromId = player.id;
        toId = 'BANK';

        // 실제 매각 금액으로 payload.amount 업데이트 (거래 기록용)
        payload.amount = sellPrice;

        // 매각 내역 설명 생성
        if (soldAssetNames.length > 1) {
          txDescription = `'${soldAssetNames[0]}' 외 ${soldAssetNames.length - 1}건 일괄 매각 (원가: ${totalValue}원)`;
        } else {
          txDescription = `'${asset.name}' 매각 (원가: ${asset.value}원)`;
        }
        break;
      }

      default:
        throw new Error('잘못된 거래 유형입니다');
    }

    const transaction: Transaction = {
      id: randomUUID(),
      type: payload.type,
      amount: payload.amount,
      fromId,
      toId,
      timestamp: Date.now(),
      description: txDescription || payload.type,
      status: 'COMPLETED', // 기본 상태
      // T008: BANK_RECEIVE인 경우 reason 저장
      ...(payload.type === 'BANK_RECEIVE' && payload.reason ? { reason: payload.reason } : {})
    };

    store.transactions.set(transaction.id, transaction);

    return transaction;
  }

  // Task 6.1: 거래 조회
  getTransaction(transactionId: string): Transaction | undefined {
    return store.transactions.get(transactionId);
  }

  // 거래 취소 가능 시간 제한 (2분 = 120초 = 120000ms)
  private readonly CANCEL_TIME_LIMIT_MS = 120000;

  // 복지기금 락 조건: 특정 시점 이후 WELFARE_RECEIVE 거래가 있는지 확인
  private hasWelfarePayoutAfter(timestamp: number): boolean {
    for (const tx of store.transactions.values()) {
      if (
        tx.type === 'WELFARE_RECEIVE' &&
        tx.status !== 'CANCELLED' &&
        tx.timestamp > timestamp
      ) {
        return true;
      }
    }
    return false;
  }

  // Task 6.1: 거래 취소 요청
  // 시간 제한: 거래 발생 후 2분 이내만 취소 가능
  // 복지기금 락 조건: 기부 이후 수령 거래가 있으면 취소 불가
  requestCancelTransaction(roomId: string, transactionId: string, requesterId: string): CancelRequest | { error: string } {
    const transaction = this.getTransaction(transactionId);

    // 기본 검증
    if (!transaction) return { error: '거래를 찾을 수 없습니다' };
    if (transaction.fromId !== requesterId) return { error: '본인의 거래만 취소할 수 있습니다' };
    if (transaction.status === 'CANCELLED') return { error: '이미 취소된 거래입니다' };

    // 시간 제한 검증: 거래 발생 후 2분 이내만 취소 가능
    const elapsed = Date.now() - transaction.timestamp;
    if (elapsed > this.CANCEL_TIME_LIMIT_MS) {
      return { error: '거래 취소 가능 시간이 만료되었습니다 (2분 초과)' };
    }

    const room = store.rooms.get(roomId);
    if (!room) return { error: '방을 찾을 수 없습니다' };

    // 복지기금 기부(DONATE to FUND) 락 조건 검증
    // 기부 이후 단 한 번이라도 수령(WELFARE_RECEIVE)이 발생했다면 취소 불가
    if (transaction.type === 'DONATE' && transaction.toId === 'FUND') {
      const hasPayoutAfterDonation = this.hasWelfarePayoutAfter(transaction.timestamp);
      if (hasPayoutAfterDonation) {
        return { error: '이미 사용된 기부금은 취소할 수 없습니다 (복지기금 수령 발생)' };
      }
    }

    // 은행/복지기금 거래는 즉시 취소
    if (transaction.toId === 'BANK' || transaction.toId === 'FUND') {
      const result = this.cancelTransaction(roomId, transactionId, requesterId);
      if ('error' in result) return result;
      return {
        id: randomUUID(),
        transactionId,
        requesterId,
        targetId: transaction.toId,
        status: 'APPROVED',
        createdAt: Date.now(),
        expiresAt: Date.now()
      } as CancelRequest;
    }

    // 플레이어 간 거래: 상대방 동의 필요
    const targetPlayer = room.players.find(p => p.id === transaction.toId);
    if (!targetPlayer) return { error: '상대방을 찾을 수 없습니다' };

    // 취소 요청 생성 (상대방 동의 필요, 60초 대기)
    // 단, 거래 취소 가능 시간 내에 완료되어야 함
    const remainingTime = this.CANCEL_TIME_LIMIT_MS - elapsed;
    const expiresIn = Math.min(60000, remainingTime); // 60초 또는 남은 시간 중 짧은 것

    const request: CancelRequest = {
      id: randomUUID(),
      transactionId,
      requesterId,
      targetId: transaction.toId as string,
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn
    };
    store.cancelRequests.set(request.id, request);
    return request;
  }

  // Task 6.1: 거래 취소 응답
  respondCancelRequest(roomId: string, requestId: string, responderId: string, approve: boolean): CancelRequest | { error: string } {
    const request = store.cancelRequests.get(requestId);

    if (!request) return { error: '취소 요청을 찾을 수 없습니다' };
    if (request.targetId !== responderId) return { error: '해당 요청에 응답할 권한이 없습니다' };
    if (request.status !== 'PENDING') return { error: '이미 처리된 요청입니다' };
    if (Date.now() > request.expiresAt) return { error: '요청이 만료되었습니다' };

    request.status = approve ? 'APPROVED' : 'REJECTED';
    request.respondedAt = Date.now();

    if (approve) {
      this.cancelTransaction(roomId, request.transactionId, request.requesterId);
    }

    return request;
  }

  // Task 6.1: 실제 거래 취소 수행
  cancelTransaction(roomId: string, transactionId: string, cancelledBy: string): Transaction | { error: string } {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) return { error: '거래를 찾을 수 없습니다' };

    const room = store.rooms.get(roomId);
    if (!room) return { error: '방을 찾을 수 없습니다' };

    // 자산 복원 - 발신자에게 돈 반환
    const fromPlayer = room.players.find(p => p.id === transaction.fromId);
    if (fromPlayer) {
      fromPlayer.cash += transaction.amount;
    }

    // 수신자로부터 차감 (플레이어인 경우만)
    if (transaction.toId !== 'BANK' && transaction.toId !== 'FUND') {
      const toPlayer = room.players.find(p => p.id === transaction.toId);
      if (toPlayer) {
        toPlayer.cash -= transaction.amount;
      }
    } else if (transaction.toId === 'FUND') {
      // 복지기금으로 보낸 경우 복지기금에서 차감
      room.welfareFund -= transaction.amount;
    }
    // BANK는 무한 자원이므로 차감 불필요

    transaction.status = 'CANCELLED';
    transaction.cancelledAt = Date.now();
    transaction.cancelledBy = cancelledBy;

    return transaction;
  }
}

export const transactionService = new TransactionService();
