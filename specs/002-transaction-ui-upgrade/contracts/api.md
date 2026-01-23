# API Contracts: 거래 UI 고도화

**Status**: Phase 1 Design

## Socket.IO Events

### Client to Server

#### `tx:request` (Update)

Existing event. Payload needs update to support Land/Building types.

```typescript
interface TransactionRequest {
  type: 'BUY_ASSET' | 'TRANSFER' | 'PAY_COST' | 'DONATE' | 'WELFARE_RECEIVE';
  amount: number;
  // For TRANSFER
  toId?: string;
  // For BUY_ASSET
  assetType?: 'LAND' | 'BUILDING'; // [NEW] Required if type is BUY_ASSET
}
```

#### `vote:request_fund` (Update)

Logic update only.

- **Payload**: `amount` param is now ignored or set to `MAX`. Backend enforces full fund amount.

### Server to Client

#### `room:sync` (Update)

Broadcasts updated Room state including Player assets.

- **Player Object**: Now includes `assets: Asset[]`.

### Behavior Changes

- **Auto-Close**:
  - Frontend listens for `tx:processed` (Success) or `error` (Fail).
  - If `tx:processed` received matches my request, close Modal.
  - If `vote:result` (Approved) received, close Modal.
