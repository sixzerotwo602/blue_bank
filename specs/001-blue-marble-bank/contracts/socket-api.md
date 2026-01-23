# Socket.io API Contract

**Feature**: 001-blue-marble-bank
**Transport**: WebSocket (Socket.io)

## Common Types

```typescript
type Response<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## Room Events

### `room:create` (Client -> Server)

Create a new game room.

- **Payload**: `{ nickname: string }`
- **Ack**: `Response<{ roomId: string, myId: string }>`

### `room:join` (Client -> Server)

Join an existing room.

- **Payload**: `{ roomId: string, nickname: string }`
- **Ack**: `Response<{ myId: string, roomState: Room }>`

### `room:sync` (Server -> Client Broadcast)

Sent when room state changes (player join/leave, ready state).

- **Payload**: `Room` (Full room object)

## Game Events

### `game:start` (Client -> Server)

Host starts the game.

- **Payload**: `{}`
- **Ack**: `Response<void>`

### `game:started` (Server -> Client Broadcast)

Notify all players game has started.

- **Payload**: `{}`

## Transaction Events

### `tx:request` (Client -> Server)

Request a financial transaction.

- **Payload**:
  ```typescript
  {
    type: 'TRANSFER' | 'BUY_ASSET' | 'PAY_COST' | 'DONATE' | 'SALARY';
    amount: number;
    toId?: string; // Required for TRANSFER
  }
  ```
- **Ack**: `Response<{ txId: string }>`

### `tx:processed` (Server -> Client Broadcast)

Notify transaction completion (balances updated).

- **Payload**:
  ```typescript
  {
    txId: string;
    fromId: string;
    toId: string;
    amount: number;
    type: string;
    newBalances: { [playerId: string]: number }; // Updated cash balances
  }
  ```

## Welfare Fund & Voting

### `vote:request_fund` (Client -> Server)

Request to take the welfare fund.

- **Payload**: `{}`
- **Ack**: `Response<{ voteId: string }>`

### `vote:started` (Server -> Client Broadcast)

A vote has started.

- **Payload**: `Vote` (Vote object)

### `vote:cast` (Client -> Server)

Cast a vote.

- **Payload**: `{ voteId: string, approve: boolean }`
- **Ack**: `Response<void>`

### `vote:updated` (Server -> Client Broadcast)

Vote progress update (allows real-time tally).

- **Payload**: `Vote` (Vote object)

### `vote:ended` (Server -> Client Broadcast)

Vote result.

- **Payload**:
  ```typescript
  {
    voteId: string;
    approved: boolean;
    distributedAmount: number; // 0 if rejected
  }
  ```
