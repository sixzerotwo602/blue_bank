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
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.id === requesterId);
    if (!player) throw new Error('Player not found');

    if (payload.amount <= 0) throw new Error('Amount must be positive');

    let fromId: string | 'BANK' | 'FUND' = requesterId;
    let toId: string | 'BANK' | 'FUND' = 'BANK';

    switch (payload.type) {
      case 'TRANSFER': {
        if (!payload.toId) throw new Error('Recipient required for transfer');
        const recipient = room.players.find(p => p.id === payload.toId);
        if (!recipient) throw new Error('Recipient not found');
        
        if (player.cash < payload.amount) throw new Error('Insufficient funds');
        
        player.cash -= payload.amount;
        recipient.cash += payload.amount;
        
        fromId = player.id;
        toId = recipient.id;
        break;
      }

      case 'BUY_ASSET': {
        if (player.cash < payload.amount) throw new Error('Insufficient funds');
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
        if (player.cash < payload.amount) throw new Error('Insufficient funds');
        player.cash -= payload.amount;
        fromId = player.id;
        toId = 'BANK';
        break;

      case 'DONATE':
        if (player.cash < payload.amount) throw new Error('Insufficient funds');
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
          if (room.welfareFund < payload.amount) throw new Error('Insufficient welfare fund');
          room.welfareFund -= payload.amount;
          player.cash += payload.amount;
          fromId = 'FUND';
          toId = player.id;
          break;

      default:
        throw new Error('Invalid transaction type');
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
