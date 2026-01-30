# Socket.io Event Contracts: 뱅킹 UI 개선

**Date**: 2026-01-30
**Feature**: 007-banking-features-v2

## 1. 새로운 Client → Server 이벤트

### 1.1 거래 내역 조회

```typescript
Event: 'transaction:get_history'

// Request
// (no payload, uses socket.data.playerId internally)

// Response (callback)
{
  transactions: Transaction[]  // 최신순 정렬
}

// Example
socket.emit('transaction:get_history', (transactions) => {
  console.log(transactions);
  // [
  //   { id: 'tx-1', type: 'TRANSFER', amount: 50000, ... },
  //   { id: 'tx-2', type: 'BUY_ASSET', amount: 100000, ... }
  // ]
});
```

### 1.2 은행 수령 요청 (호스트 전용)

```typescript
Event: 'tx:bank_receive'

// Request
{
  targetPlayerId: string;      // 수령 대상 플레이어 ID
  amount: number;              // 지급 금액
  reason: 'LOTTERY' | 'PRIZE' | 'BONUS' | 'OTHER';
  customReason?: string;       // reason이 'OTHER'일 때 필수
}

// Response (callback)
{
  success: boolean;
  message?: string;            // 실패 시 에러 메시지
}

// Validation Rules
- 요청자가 호스트여야 함
- targetPlayerId가 같은 방의 플레이어여야 함
- amount > 0
- reason이 'OTHER'면 customReason 필수

// Example
socket.emit('tx:bank_receive', {
  targetPlayerId: 'player-123',
  amount: 500000,
  reason: 'LOTTERY'
}, (response) => {
  if (response.success) {
    toast.success('지급 완료');
  } else {
    toast.error(response.message);
  }
});
```

### 1.3 자산 매각 요청

```typescript
Event: 'tx:sell_asset'

// Request
{
  assetId: string;             // 매각할 자산 ID
}

// Response (callback)
{
  success: boolean;
  message?: string;            // 실패 시 에러 메시지
  receivedAmount?: number;     // 성공 시 받은 금액 (원래 가치의 50%)
}

// Validation Rules
- assetId가 요청자 소유의 자산이어야 함
- 자산이 존재해야 함

// Example
socket.emit('tx:sell_asset', {
  assetId: 'asset-456'
}, (response) => {
  if (response.success) {
    toast.success(`${response.receivedAmount?.toLocaleString()}원을 받았습니다`);
  } else {
    toast.error(response.message);
  }
});
```

### 1.4 게임 종료 투표 요청 (호스트 전용)

```typescript
Event: 'game:request_end'

// Request
// (no payload)

// Response (callback)
{
  success: boolean;
  message?: string;
}

// Side Effects
- 성공 시 'game_end_vote:started' 이벤트가 모든 플레이어에게 브로드캐스트됨
- 60초 타이머 시작

// Validation Rules
- 요청자가 호스트여야 함
- 게임이 PLAYING 상태여야 함
- 이미 진행 중인 게임 종료 투표가 없어야 함
```

### 1.5 게임 종료 투표 응답

```typescript
Event: 'game_end_vote:cast'

// Request
{
  voteId: string;
  approve: boolean;
}

// Response
// (no callback, 결과는 'game_end_vote:updated'로 브로드캐스트)

// Validation Rules
- 유효한 voteId
- 아직 투표하지 않은 플레이어
- 투표가 IN_PROGRESS 상태
```

### 1.6 알림 읽음 처리

```typescript
Event: 'notification:mark_read'

// Request
{
  notificationId: string;
}

// Response
// (no callback)

// ---

Event: 'notification:mark_all_read'

// Request
// (no payload)

// Response
// (no callback)
```

## 2. 새로운 Server → Client 이벤트

### 2.1 알림 수신

```typescript
Event: 'notification:received'

// Payload
{
  id: string;
  type: 'TRANSFER_RECEIVED' | 'BANK_RECEIVED' | 'VOTE_STARTED' |
        'VOTE_ENDED' | 'GAME_END_REQUESTED' | 'GAME_ENDED';
  message: string;             // 표시할 메시지
  targetPlayerId: string;      // 수신자 ID
  read: boolean;               // 항상 false
  timestamp: number;
  relatedData?: {
    transactionId?: string;
    voteId?: string;
    fromPlayerName?: string;
    amount?: number;
  };
}

// Example message formats
- TRANSFER_RECEIVED: "홍길동님이 50만원을 보냈습니다"
- BANK_RECEIVED: "은행에서 100만원을 받았습니다 (복권)"
- GAME_END_REQUESTED: "호스트가 게임 종료를 요청했습니다"
```

### 2.2 알림 개수 업데이트

```typescript
Event: 'notification:count'

// Payload
{
  count: number;               // 읽지 않은 알림 개수
}
```

### 2.3 거래 내역 응답

```typescript
Event: 'transaction:history'

// Payload
{
  transactions: Transaction[];  // 해당 플레이어 관련 거래만 필터링됨
}
```

### 2.4 게임 종료 투표 시작

```typescript
Event: 'game_end_vote:started'

// Payload
{
  id: string;
  roomId: string;
  requesterId: string;
  status: 'IN_PROGRESS';
  votes: Record<string, boolean | null>;  // 초기값: 모두 null
  createdAt: number;
  expiresAt: number;           // createdAt + 60000
}
```

### 2.5 게임 종료 투표 업데이트

```typescript
Event: 'game_end_vote:updated'

// Payload
{
  id: string;
  roomId: string;
  requesterId: string;
  status: 'IN_PROGRESS';
  votes: Record<string, boolean | null>;  // 투표한 플레이어는 boolean
  createdAt: number;
  expiresAt: number;
}
```

### 2.6 게임 종료 투표 종료

```typescript
Event: 'game_end_vote:ended'

// Payload
{
  id: string;
  roomId: string;
  requesterId: string;
  status: 'APPROVED' | 'REJECTED';
  votes: Record<string, boolean | null>;
  createdAt: number;
  expiresAt: number;
}

// Side Effects
- APPROVED: 'game:ended' 이벤트 후속 발생
- REJECTED: 게임 계속 진행
```

## 3. 기존 이벤트 수정

### 3.1 tx:request 확장

```typescript
// 기존 payload에 추가 옵션

// BANK_RECEIVE 타입 (호스트 전용)
{
  type: 'BANK_RECEIVE',
  amount: number,
  toId: string,              // 수령 대상 플레이어 ID
  reason: 'LOTTERY' | 'PRIZE' | 'BONUS' | 'OTHER',
  customReason?: string
}

// SELL_ASSET 타입
{
  type: 'SELL_ASSET',
  assetId: string            // 매각할 자산 ID
  // amount는 서버에서 계산 (자산 가치 * 0.5)
}
```

## 4. 에러 코드

| 코드 | 메시지 | 상황 |
|------|--------|------|
| `NOT_HOST` | "호스트만 실행할 수 있습니다" | 호스트 전용 기능을 비호스트가 요청 |
| `PLAYER_NOT_FOUND` | "플레이어를 찾을 수 없습니다" | 잘못된 targetPlayerId |
| `ASSET_NOT_FOUND` | "자산을 찾을 수 없습니다" | 잘못된 assetId |
| `ASSET_NOT_OWNED` | "본인 소유 자산이 아닙니다" | 다른 플레이어의 자산 매각 시도 |
| `INVALID_AMOUNT` | "금액이 올바르지 않습니다" | amount <= 0 |
| `VOTE_IN_PROGRESS` | "이미 투표가 진행 중입니다" | 중복 투표 요청 |
| `GAME_NOT_PLAYING` | "게임이 진행 중이 아닙니다" | PLAYING 상태가 아닐 때 |
| `ALREADY_VOTED` | "이미 투표했습니다" | 중복 투표 |
