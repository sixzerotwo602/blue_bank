# 데이터 모델 레퍼런스

> 모든 타입은 `shared/src/index.ts`에 정의되며, 프론트엔드와 백엔드가 공유한다.

타입 소스: [`shared/src/index.ts`](../shared/src/index.ts)

---

## 핵심 인터페이스

### Player

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 소켓 ID (재연결 시 변경됨) |
| `nickname` | `string` | 닉네임 (최대 20자) |
| `cash` | `number` | 보유 현금 (원 단위) |
| `assetValue` | `number` | 부동산 총 가치 |
| `assets` | `Asset[]` | 보유 자산 목록 |
| `roomId` | `string` | 현재 방 ID |
| `isReady` | `boolean` | 준비 완료 여부 |
| `isHost` | `boolean` | 호스트 여부 |
| `connected` | `boolean` | 연결 상태 |
| `connectionStatus` | `ConnectionStatus` | 상세 연결 상태 |
| `disconnectedAt` | `number \| null` | 연결 해제 시각 |

### Room

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 6자리 방 코드 (`[A-Z0-9]{6}`) |
| `status` | `RoomStatus` | 방 상태 |
| `players` | `Player[]` | 참가 플레이어 배열 |
| `welfareFund` | `number` | 복지기금 잔액 |
| `hostId` | `string` | 호스트 플레이어 ID |
| `createdAt` | `number` | 방 생성 타임스탬프 |
| `pendingHostMigration?` | `boolean` | 호스트 마이그레이션 진행 중 |

### Asset

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 자산 고유 ID |
| `type` | `'LAND' \| 'BUILDING'` | 자산 종류 |
| `buildingType?` | `BuildingType` | 건물 유형 (BUILDING 타입일 때) |
| `name?` | `string` | 자산명 (최대 20자) |
| `value` | `number` | 자산 가치 |
| `createdAt` | `number` | 취득 타임스탬프 |
| `landId?` | `string` | 건물이 위치한 토지 ID |

### Transaction

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 거래 고유 ID |
| `type` | `TransactionType` | 거래 유형 |
| `amount` | `number` | 거래 금액 |
| `fromId` | `string \| 'BANK' \| 'FUND'` | 출금 주체 |
| `toId` | `string \| 'BANK' \| 'FUND'` | 입금 대상 |
| `timestamp` | `number` | 거래 시각 |
| `description?` | `string` | 거래 설명 |
| `reason?` | `BankReceiveReason \| string` | 은행 수령 사유 |
| `soldAsset?` | `{ assetId, assetName, originalValue }` | 매각 자산 정보 |
| `status` | `TransactionStatus` | 거래 상태 |
| `cancelledAt?` | `number` | 취소 시각 |
| `cancelledBy?` | `string` | 취소 요청자 |
| `locked?` | `boolean` | 취소 불가 락 (복지기금 수령 후) |

### Vote

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 투표 고유 ID |
| `roomId` | `string` | 방 ID |
| `requesterId` | `string` | 요청자 ID |
| `voteType?` | `VoteType` | 투표 유형 |
| `amount` | `number` | 투표 대상 금액 |
| `status` | `VoteStatus` | 투표 상태 |
| `votes` | `Record<string, boolean>` | 플레이어별 찬반 |
| `createdAt` | `number` | 생성 시각 |
| `expiresAt` | `number` | 만료 시각 (60초) |
| `timeoutHandledAs?` | `'REJECT'` | 미응답 처리 방식 |
| `reason?` | `BankReceiveReason \| string` | 은행 수령 사유 |

### GameEndVote

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 투표 고유 ID |
| `roomId` | `string` | 방 ID |
| `requesterId` | `string` | 호스트 ID |
| `status` | `'IN_PROGRESS' \| 'APPROVED' \| 'REJECTED' \| 'CANCELLED'` | 투표 상태 |
| `votes` | `Record<string, boolean \| null>` | 플레이어별 찬반 (null = 미응답) |
| `createdAt` | `number` | 생성 시각 |
| `expiresAt` | `number` | 만료 시각 (60초) |
| `timeoutHandledAs` | `'REJECT'` | 미응답 처리: 거절 |

### CancelRequest

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 요청 고유 ID |
| `transactionId` | `string` | 대상 거래 ID |
| `requesterId` | `string` | 취소 요청자 |
| `targetId` | `string` | 상대방 (동의 필요) |
| `status` | `'PENDING' \| 'APPROVED' \| 'REJECTED' \| 'EXPIRED'` | 요청 상태 |
| `createdAt` | `number` | 생성 시각 |
| `expiresAt` | `number` | 만료 시각 (60초) |
| `respondedAt?` | `number` | 응답 시각 |

### Notification

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 알림 고유 ID |
| `type` | `NotificationType` | 알림 유형 |
| `message` | `string` | 알림 메시지 |
| `targetPlayerId` | `string` | 대상 플레이어 |
| `read` | `boolean` | 읽음 여부 |
| `timestamp` | `number` | 생성 시각 |
| `relatedData?` | `{ transactionId?, voteId?, fromPlayerName?, amount? }` | 관련 데이터 |

### DisconnectedSession

| 필드 | 타입 | 설명 |
|------|------|------|
| `nickname` | `string` | 닉네임 |
| `roomId` | `string` | 방 ID |
| `cash` | `number` | 보유 현금 |
| `assetValue` | `number` | 자산 가치 |
| `assets` | `Asset[]` | 보유 자산 |
| `disconnectedAt` | `number` | 연결 해제 시각 |
| `expiresAt` | `number` | 세션 만료 시각 (5분) |
| `originalSocketId` | `string` | 원래 소켓 ID |

### Ranking

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 플레이어 ID |
| `nickname` | `string` | 닉네임 |
| `cash` | `number` | 현금 |
| `assetValue` | `number` | 자산 가치 |
| `totalAssets` | `number` | 총 자산 (현금 + 자산) |
| `rank` | `number` | 순위 |

---

## 열거형

### RoomStatus

```typescript
type RoomStatus = 'LOBBY' | 'PLAYING' | 'ENDED';
```

### ConnectionStatus

```typescript
type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
```

### TransactionType

```typescript
type TransactionType =
  | 'TRANSFER'         // 플레이어 간 송금
  | 'BUY_ASSET'        // 부동산 매입
  | 'PAY_COST'         // 은행에 납부
  | 'DONATE'           // 복지기금 기부
  | 'SALARY'           // 월급 수령
  | 'WELFARE_RECEIVE'  // 복지기금 수령
  | 'BANK_RECEIVE'     // 은행 수령 (복권, 우승상금 등)
  | 'SELL_ASSET';      // 자산 매각 (반액)
```

### TransactionStatus

```typescript
type TransactionStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING_CANCEL';
```

### BankReceiveReason

```typescript
type BankReceiveReason = 'LOTTERY' | 'PRIZE' | 'BONUS' | 'OTHER';
```

### VoteType

```typescript
type VoteType = 'WELFARE' | 'GAME_END' | 'BANK_RECEIVE';
```

### VoteStatus

```typescript
type VoteStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
```

### BuildingType

```typescript
type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';
```

### NotificationType

```typescript
type NotificationType =
  | 'TRANSFER_RECEIVED'    // 송금 수신
  | 'BANK_RECEIVED'        // 은행 수령
  | 'VOTE_STARTED'         // 투표 시작
  | 'VOTE_ENDED'           // 투표 종료
  | 'GAME_END_REQUESTED'   // 게임 종료 투표 시작
  | 'GAME_ENDED';          // 게임 종료
```

---

## Payload 타입

### ConnectionStatusPayload

```typescript
{ playerId: string; status: ConnectionStatus; nickname: string }
```

### HostMigratingPayload

```typescript
{ disconnectedHostId: string; remainingSeconds: number }
```

### HostMigratedPayload

```typescript
{ oldHostId: string; newHostId: string; newHostNickname: string }
```

### PlayerKickedPayload

```typescript
{ playerId: string; nickname: string }
```

### GameEndedPayload

```typescript
{ rankings: Ranking[] }
```

---

## MemoryStore 구조

백엔드 인메모리 저장소. 자세한 내용은 [architecture.md](./architecture.md#memorystore-싱글톤)를 참고한다.

### 주요 Map (7개)

| Map | 키 → 값 |
|-----|---------|
| `rooms` | `roomId → Room` |
| `transactions` | `txId → Transaction` |
| `votes` | `voteId → Vote` |
| `gameEndVotes` | `voteId → GameEndVote` |
| `disconnectedSessions` | `sessionKey → DisconnectedSession` |
| `notifications` | `notifId → Notification` |
| `cancelRequests` | `cancelId → CancelRequest` |

### 보조 인덱스 (4개)

| 인덱스 | 키 → 값 | 용도 |
|--------|---------|------|
| `playerToRoom` | `playerId → roomId` | 플레이어 소속 방 역참조 |
| `roomTransactions` | `roomId → Set<txId>` | 방별 거래 목록 |
| `playerNotifications` | `playerId → Set<notifId>` | 플레이어별 알림 목록 |
| `roomCreatorIps` | `roomId → ip` | IP별 방 생성 제한 |

---

## 참조

- [`shared/src/index.ts`](../shared/src/index.ts) — 전체 타입 정의 원본
- [socket-events.md](./socket-events.md) — 이벤트별 payload 사용 맥락
- [architecture.md](./architecture.md) — MemoryStore 상세 구조
