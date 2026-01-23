import { store } from '../models/store.js';
import { randomUUID } from 'crypto';
export class TransactionService {
    processTransaction(roomId, requesterId, payload) {
        const room = store.rooms.get(roomId);
        if (!room)
            throw new Error('Room not found');
        const player = room.players.find(p => p.id === requesterId);
        if (!player)
            throw new Error('Player not found');
        if (payload.amount <= 0)
            throw new Error('Amount must be positive');
        let fromId = requesterId;
        let toId = 'BANK';
        switch (payload.type) {
            case 'TRANSFER': {
                if (!payload.toId)
                    throw new Error('Recipient required for transfer');
                const recipient = room.players.find(p => p.id === payload.toId);
                if (!recipient)
                    throw new Error('Recipient not found');
                if (player.cash < payload.amount)
                    throw new Error('Insufficient funds');
                player.cash -= payload.amount;
                recipient.cash += payload.amount;
                fromId = player.id;
                toId = recipient.id;
                break;
            }
            case 'BUY_ASSET':
                if (player.cash < payload.amount)
                    throw new Error('Insufficient funds');
                player.cash -= payload.amount;
                player.assetValue += payload.amount;
                fromId = player.id;
                toId = 'BANK';
                break;
            case 'PAY_COST':
                if (player.cash < payload.amount)
                    throw new Error('Insufficient funds');
                player.cash -= payload.amount;
                fromId = player.id;
                toId = 'BANK';
                break;
            case 'DONATE':
                if (player.cash < payload.amount)
                    throw new Error('Insufficient funds');
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
                if (room.welfareFund < payload.amount)
                    throw new Error('Insufficient welfare fund');
                room.welfareFund -= payload.amount;
                player.cash += payload.amount;
                fromId = 'FUND';
                toId = player.id;
                break;
            default:
                throw new Error('Invalid transaction type');
        }
        const transaction = {
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
//# sourceMappingURL=transaction.service.js.map