# Data Model: UX 버그 수정 및 기능 개선 v2

**Date**: 2026-02-05
**Branch**: `009-ux-bugfix-v2`

## 타입 변경 사항

### 1. Transaction 확장 (거래 취소 기능)

```typescript
// shared/src/index.ts

// 거래 상태 추가
export type TransactionStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING_CANCEL';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  timestamp: number;
  description?: string;
  reason?: BankReceiveReason | string;
  soldAsset?: {
    assetId: string;
    assetName: string;
    originalValue: number;
  };
  // NEW: 거래 상태
  status: TransactionStatus;
  // NEW: 취소 관련 정보
  cancelledAt?: number;
  cancelledBy?: string;
}
```

### 2. CancelRequest 신규 타입 (거래 취소 요청)

```typescript
// shared/src/index.ts

export interface CancelRequest {
  id: string;
  transactionId: string;
  requesterId: string;      // 취소 요청자
  targetId: string;         // 상대방 (동의 필요)
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;        // 60초 후
  respondedAt?: number;
}
```

### 3. Vote/GameEndVote 타임아웃 처리 변경

```typescript
// shared/src/index.ts

// 기존 Vote 인터페이스 확장
export interface Vote {
  id: string;
  roomId: string;
  requesterId: string;
  voteType?: VoteType;
  amount: number;
  status: VoteStatus;
  votes: Record<string, boolean>;
  createdAt: number;
  expiresAt: number;
  // NEW: 미응답 처리 방식 (기존 암묵적 → 명시적)
  timeoutHandledAs: 'REJECT';  // 모든 투표 거절로 통일
}

// GameEndVote 변경
export interface GameEndVote {
  id: string;
  roomId: string;
  requesterId: string;
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';  // CANCELLED 추가
  votes: Record<string, boolean | null>;
  createdAt: number;
  expiresAt: number;
  timeoutHandledAs: 'REJECT';  // 'APPROVE' → 'REJECT' 변경
}
```

### 4. VoteType 확장 (은행 수령 투표)

```typescript
// shared/src/index.ts

export type VoteType = 'WELFARE' | 'GAME_END' | 'BANK_RECEIVE';

// 은행 수령 투표 전용 인터페이스 (Vote 확장)
export interface BankReceiveVote extends Omit<Vote, 'voteType'> {
  voteType: 'BANK_RECEIVE';
  reason?: BankReceiveReason | string;  // 수령 사유
}
```

### 5. Asset 인터페이스 (변경 없음, 참조용)

```typescript
// 기존 Asset 인터페이스 - name 필드로 수정 가능
export interface Asset {
  id: string;
  type: 'LAND' | 'BUILDING';
  buildingType?: BuildingType;
  name?: string;              // 이 필드를 수정
  value: number;
  createdAt: number;
  // NEW: 연관 토지 ID (건물인 경우)
  landId?: string;            // 건물이 위치한 토지 ID
}
```

## Store 확장

```typescript
// backend/src/models/store.ts

class Store {
  rooms: Map<string, Room>;
  votes: Map<string, Vote>;
  gameEndVotes: Map<string, GameEndVote>;
  transactions: Map<string, Transaction[]>;  // roomId → transactions
  notifications: Map<string, Notification[]>;

  // NEW: 거래 취소 요청
  cancelRequests: Map<string, CancelRequest>;  // requestId → CancelRequest

  // NEW: 투표 타임아웃 타이머
  voteTimeouts: Map<string, NodeJS.Timeout>;  // voteId → timeout
}
```

## 신규 Socket Events

### ServerToClientEvents

```typescript
export interface ServerToClientEvents {
  // 기존 이벤트들...

  // NEW: 게임 종료 투표 취소
  'game_end_vote:cancelled': (payload: {
    voteId: string;
    cancelledBy: string;
  }) => void;

  // NEW: 거래 취소 요청
  'tx:cancel_requested': (request: CancelRequest) => void;
  'tx:cancel_responded': (request: CancelRequest) => void;
  'tx:cancelled': (transaction: Transaction) => void;

  // NEW: 은행 수령 투표
  'bank_receive_vote:started': (vote: Vote) => void;
  'bank_receive_vote:updated': (vote: Vote) => void;
  'bank_receive_vote:ended': (vote: Vote) => void;

  // NEW: 자산명 변경
  'asset:renamed': (payload: {
    playerId: string;
    assetId: string;
    oldName: string;
    newName: string;
  }) => void;
}
```

### ClientToServerEvents

```typescript
export interface ClientToServerEvents {
  // 기존 이벤트들...

  // NEW: 거래 취소 요청
  'tx:request_cancel': (
    transactionId: string,
    callback: (response: { success: boolean; error?: string; requestId?: string }) => void
  ) => void;

  // NEW: 거래 취소 응답
  'tx:respond_cancel': (
    requestId: string,
    approve: boolean,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;

  // NEW: 은행 수령 투표 요청 (플레이어 직접 요청)
  'vote:request_bank_receive': (
    payload: {
      amount: number;
      reason: BankReceiveReason;
      customReason?: string;
    },
    callback: (response: { success: boolean; error?: string; voteId?: string }) => void
  ) => void;

  // NEW: 자산명 변경
  'asset:rename': (
    assetId: string,
    newName: string,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
}
```

## 관계도

```
Player (1) ──────── (N) Asset
    │                    │
    │                    │ landId (건물→토지)
    │                    ▼
    │               Asset (토지)
    │
    ├── (N) Transaction ──── (1) CancelRequest (optional)
    │         │
    │         │ status: COMPLETED | CANCELLED | PENDING_CANCEL
    │         │
    ├── (1) Vote (투표 요청자)
    │         │
    │         └── voteType: WELFARE | GAME_END | BANK_RECEIVE
    │
    └── (1) GameEndVote (호스트만)
              │
              └── status: IN_PROGRESS | APPROVED | REJECTED | CANCELLED
```

## 검증 규칙

### 거래 취소 검증
1. 취소 요청자 = 원래 송금자 (fromId)
2. 수신자 잔액 >= 취소 금액
3. 거래 상태 = 'COMPLETED' (이미 취소된 거래 불가)
4. 은행 거래: 즉시 취소 (동의 불필요)
5. 플레이어 거래: 상대방 동의 필요 (60초 타임아웃)

### 투표 타임아웃 검증
1. 모든 투표 60초 제한
2. 미응답 플레이어 = 거절로 처리
3. 과반수 계산: 투표 참여자 기준 (퇴장 플레이어 제외)

### 자산명 검증
1. 빈 문자열 불가
2. 최대 20자
3. 중복 허용 (동일 플레이어 내 다른 토지와 중복 가능 - 이전 제한 완화)
