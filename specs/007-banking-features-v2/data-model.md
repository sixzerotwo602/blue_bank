# Data Model: 뱅킹 UI 개선 및 기능 확장

**Date**: 2026-01-30
**Feature**: 007-banking-features-v2

## 1. 타입 변경 사항 (shared/src/index.ts)

### 1.1 TransactionType 확장

```typescript
// 기존
export type TransactionType = 'TRANSFER' | 'BUY_ASSET' | 'PAY_COST' | 'DONATE' | 'SALARY' | 'WELFARE_RECEIVE';

// 변경 후
export type TransactionType =
  | 'TRANSFER'        // 플레이어 간 송금
  | 'BUY_ASSET'       // 부동산 매입
  | 'PAY_COST'        // 은행에 납부
  | 'DONATE'          // 복지기금 기부
  | 'SALARY'          // 월급 수령
  | 'WELFARE_RECEIVE' // 복지기금 수령
  | 'BANK_RECEIVE'    // 은행 수령 (복권, 우승상금 등) [NEW]
  | 'SELL_ASSET';     // 자산 매각 (반액 대매출) [NEW]
```

### 1.2 Transaction 인터페이스 확장

```typescript
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  timestamp: number;
  description?: string;
  // NEW: 은행 수령 사유 (BANK_RECEIVE 타입일 때)
  reason?: BankReceiveReason | string;
  // NEW: 매각된 자산 정보 (SELL_ASSET 타입일 때)
  soldAsset?: {
    assetId: string;
    assetName: string;
    originalValue: number;
  };
}
```

### 1.3 BankReceiveReason 타입 (신규)

```typescript
export type BankReceiveReason =
  | 'LOTTERY'       // 복권
  | 'PRIZE'         // 우승상금
  | 'BONUS'         // 보너스
  | 'OTHER';        // 기타 (customReason 필드 사용)
```

### 1.4 Notification 타입 (신규)

```typescript
export type NotificationType =
  | 'TRANSFER_RECEIVED'   // 송금 수신
  | 'BANK_RECEIVED'       // 은행 수령
  | 'VOTE_STARTED'        // 투표 시작
  | 'VOTE_ENDED'          // 투표 종료
  | 'GAME_END_REQUESTED'  // 게임 종료 투표 시작
  | 'GAME_ENDED';         // 게임 종료

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  targetPlayerId: string;
  read: boolean;
  timestamp: number;
  // 관련 데이터 (선택적)
  relatedData?: {
    transactionId?: string;
    voteId?: string;
    fromPlayerName?: string;
    amount?: number;
  };
}
```

### 1.5 VoteType 확장 (신규)

```typescript
// 기존 Vote 인터페이스에 voteType 필드 추가
export type VoteType = 'WELFARE' | 'GAME_END';

export interface Vote {
  id: string;
  roomId: string;
  requesterId: string;
  voteType: VoteType;              // NEW
  amount: number;                   // WELFARE일 때만 사용
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  votes: Record<string, boolean>;
  createdAt: number;
  expiresAt: number;
}
```

### 1.6 GameEndVote 타입 (별도 정의)

```typescript
export interface GameEndVote {
  id: string;
  roomId: string;
  requesterId: string;          // 호스트 ID
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  votes: Record<string, boolean | null>;  // null = 미응답
  createdAt: number;
  expiresAt: number;            // 60초 후
  timeoutHandledAs: 'APPROVE';  // 미응답 처리 방식
}
```

## 2. Socket.io 이벤트 변경 사항

### 2.1 ServerToClientEvents 확장

```typescript
export interface ServerToClientEvents {
  // 기존 이벤트들...

  // NEW: 알림 관련
  'notification:received': (notification: Notification) => void;
  'notification:count': (count: number) => void;

  // NEW: 거래 내역 조회 응답
  'transaction:history': (transactions: Transaction[]) => void;

  // NEW: 게임 종료 투표 관련
  'game_end_vote:started': (vote: GameEndVote) => void;
  'game_end_vote:updated': (vote: GameEndVote) => void;
  'game_end_vote:ended': (vote: GameEndVote) => void;
}
```

### 2.2 ClientToServerEvents 확장

```typescript
export interface ClientToServerEvents {
  // 기존 이벤트들...

  // NEW: 거래 내역 조회 요청
  'transaction:get_history': (
    callback: (transactions: Transaction[]) => void
  ) => void;

  // NEW: 은행 수령 요청 (호스트 전용)
  'tx:bank_receive': (
    payload: {
      targetPlayerId: string;
      amount: number;
      reason: BankReceiveReason;
      customReason?: string;  // reason이 'OTHER'일 때
    },
    callback: (response: { success: boolean; message?: string }) => void
  ) => void;

  // NEW: 자산 매각 요청
  'tx:sell_asset': (
    payload: {
      assetId: string;
    },
    callback: (response: {
      success: boolean;
      message?: string;
      receivedAmount?: number;
    }) => void
  ) => void;

  // NEW: 게임 종료 투표 요청 (호스트 전용)
  'game:request_end': (
    callback: (response: { success: boolean; message?: string }) => void
  ) => void;

  // NEW: 게임 종료 투표 응답
  'game_end_vote:cast': (
    voteId: string,
    approve: boolean
  ) => void;

  // NEW: 알림 읽음 처리
  'notification:mark_read': (notificationId: string) => void;
  'notification:mark_all_read': () => void;
}
```

## 3. Store 변경 사항 (backend/src/models/store.ts)

```typescript
class Store {
  public rooms: Map<string, Room>;
  public transactions: Map<string, Transaction>;
  public votes: Map<string, Vote>;
  public disconnectedSessions: Map<string, DisconnectedSession>;

  // NEW
  public notifications: Map<string, Notification>;
  public gameEndVotes: Map<string, GameEndVote>;

  // NEW: 플레이어별 거래 내역 조회
  getPlayerTransactions(playerId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.fromId === playerId || tx.toId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // NEW: 플레이어별 읽지 않은 알림 개수
  getUnreadNotificationCount(playerId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.targetPlayerId === playerId && !n.read)
      .length;
  }
}
```

## 4. 엔티티 관계도

```
┌─────────────┐       ┌─────────────┐
│    Room     │◄──────│   Player    │
│             │  1:N  │             │
│ - players[] │       │ - assets[]  │
│ - hostId    │       │ - cash      │
└─────────────┘       └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│Transaction  │       │    Asset    │
│             │       │             │
│ - fromId    │       │ - id        │
│ - toId      │       │ - type      │
│ - type      │       │ - value     │
│ - reason    │ NEW   └─────────────┘
│ - soldAsset │ NEW
└─────────────┘
       │
       ▼
┌─────────────┐       ┌─────────────┐
│Notification │       │ GameEndVote │
│   (NEW)     │       │    (NEW)    │
│             │       │             │
│ - type      │       │ - votes     │
│ - message   │       │ - status    │
│ - read      │       │ - expiresAt │
└─────────────┘       └─────────────┘
```

## 5. 상태 전이

### 5.1 GameEndVote 상태 전이

```
                    ┌───────────────┐
                    │  (시작 없음)   │
                    └───────┬───────┘
                            │ game:request_end (호스트)
                            ▼
                    ┌───────────────┐
                    │  IN_PROGRESS  │
                    └───────┬───────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
    전원 동의         1명 거부         60초 타임아웃
           │                │                │
           ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ APPROVED │     │ REJECTED │     │ APPROVED │
    └────┬─────┘     └──────────┘     └────┬─────┘
         │                                  │
         └──────────────┬──────────────────┘
                        ▼
                 game:ended 이벤트
```

### 5.2 자산 매각 플로우

```
플레이어 요청 (tx:sell_asset)
         │
         ▼
   자산 존재 확인
         │
    ┌────┴────┐
    │         │
   없음       있음
    │         │
    ▼         ▼
  에러    매각 처리
  반환         │
              ├── 자산 제거
              ├── 현금 += 자산가치 * 0.5
              ├── Transaction 생성 (SELL_ASSET)
              └── room:sync 브로드캐스트
```
