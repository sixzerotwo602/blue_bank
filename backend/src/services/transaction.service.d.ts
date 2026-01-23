import type { Transaction, TransactionType } from '@blue-banker/shared';
export declare class TransactionService {
    processTransaction(roomId: string, requesterId: string, payload: {
        type: TransactionType;
        amount: number;
        toId?: string;
    }): Transaction;
}
export declare const transactionService: TransactionService;
//# sourceMappingURL=transaction.service.d.ts.map