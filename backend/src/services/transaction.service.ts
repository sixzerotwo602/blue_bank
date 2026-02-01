import type { Transaction, TransactionType, Asset } from '@blue-banker/shared';
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
      case 'SELL_ASSET': {
        if (!payload.toId) throw new Error('매각할 자산을 선택해주세요');
        const assetIndex = player.assets.findIndex(a => a.id === payload.toId);
        if (assetIndex === -1) throw new Error('자산을 찾을 수 없습니다');

        const asset = player.assets[assetIndex]!;
        const sellPrice = Math.floor(asset.value * 0.5); // 50% 현금화

        // 자산 제거
        player.assets.splice(assetIndex, 1);
        player.assetValue -= asset.value;

        // 현금 지급
        player.cash += sellPrice;

        fromId = player.id;
        toId = 'BANK';

        // 실제 매각 금액으로 payload.amount 업데이트 (거래 기록용)
        payload.amount = sellPrice;
        txDescription = `'${asset.name}' 매각 (원가: ${asset.value}원)`;
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
      // T008: BANK_RECEIVE인 경우 reason 저장
      ...(payload.type === 'BANK_RECEIVE' && payload.reason ? { reason: payload.reason } : {})
    };

    store.transactions.set(transaction.id, transaction);
    
    return transaction;
  }
}

export const transactionService = new TransactionService();
