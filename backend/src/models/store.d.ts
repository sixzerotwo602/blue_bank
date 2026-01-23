import type { Room, Transaction, Vote } from '@blue-banker/shared';
declare class Store {
    rooms: Map<string, Room>;
    transactions: Map<string, Transaction>;
    votes: Map<string, Vote>;
    constructor();
    reset(): void;
}
export declare const store: Store;
export {};
//# sourceMappingURL=store.d.ts.map