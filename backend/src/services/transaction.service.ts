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
    }
  ): Transaction {
    const room = store.rooms.get(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다');

    const player = room.players.find(p => p.id === requesterId);
    if (!player) throw new Error('플레이어를 찾을 수 없습니다');

    if (payload.amount <= 0) throw new Error('금액은 0보다 커야 합니다');

    let fromId: string | 'BANK' | 'FUND' = requesterId;
    let toId: string | 'BANK' | 'FUND' = 'BANK';

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

        // Generate Name with building type (T004, T011)
        const count = player.assets.filter(a => a.type === type).length + 1;
        let nameType = '토지';
        if (type === 'BUILDING') {
          switch (buildingType) {
            case 'HOTEL': nameType = '호텔'; break;
            case 'VILLA': nameType = '별장'; break;
            default: nameType = '빌딩'; break;
          }
        }
        const name = `${nameType} #${count}`;

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

      // T036: 은행 수령 (복권, 우승상금, 보너스 등)
      case 'BANK_RECEIVE': {
        // 호스트가 지정한 플레이어에게 은행에서 지급
        const targetId = payload.toId || requesterId;
        const targetPlayer = room.players.find(p => p.id === targetId);
        if (!targetPlayer) throw new Error('대상 플레이어를 찾을 수 없습니다');
        
        targetPlayer.cash += payload.amount;
        fromId = 'BANK';
        toId = targetPlayer.id;
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
      description: payload.type
    };

    store.transactions.set(transaction.id, transaction);
    
    return transaction;
  }
}

export const transactionService = new TransactionService();
