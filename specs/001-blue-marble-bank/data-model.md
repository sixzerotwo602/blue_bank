# Data Model: Blue Marble Bank

**Feature**: 001-blue-marble-bank

## Entities

### Player (플레이어)

게임에 참여하는 개별 사용자.

```typescript
interface Player {
  id: string; // GUID or Socket ID
  nickname: string; // 사용자 표시 이름
  cash: number; // 현재 보유 현금
  assetValue: number; // 보유 자산 총액
  roomId: string; // 현재 참여 중인 방 코드
  isReady: boolean; // 게임 시작 준비 여부 (Lobby)
  isHost: boolean; // 방장 여부
  connected: boolean; // 접속 상태 (재접속 처리용)
}
```

### Room (방)

게임 세션의 단위.

```typescript
interface Room {
  id: string; // 고유 방 코드 (6자리)
  status: "LOBBY" | "PLAYING" | "ENDED";
  players: Map<string, Player>; // 참여 플레이어 목록 (Key: PlayerID)
  welfareFund: number; // 현재 복지기금 잔액
  hostId: string; // 방장 Player ID
  createdAt: number; // 생성 시간
}
```

### Transaction (거래)

금융 거래 로그.

```typescript
type TransactionType =
  | "TRANSFER"
  | "BUY_ASSET"
  | "PAY_COST"
  | "DONATE"
  | "SALARY"
  | "WELFARE_RECEIVE";

interface Transaction {
  id: string; // UUID
  type: TransactionType;
  amount: number; // 거래 금액
  fromId: string | "BANK" | "FUND"; // 송금자 (시스템 계정 포함)
  toId: string | "BANK" | "FUND"; // 수신자
  timestamp: number; // 거래 발생 시각
  description?: string; // 추가 설명 (옵션)
}
```

### Vote (투표)

복지기금 수령을 위한 투표 세션.

```typescript
interface Vote {
  id: string; // UUID
  roomId: string;
  requesterId: string; // 기금 수령 요청자
  amount: number; // 요청 금액 (보통 전액)
  status: "IN_PROGRESS" | "APPROVED" | "REJECTED";
  votes: Map<string, boolean | null>; // 플레이어별 찬성(true)/반대(false)/미투표(null)
  createdAt: number;
  expiresAt: number; // 투표 종료 시각
}
```

## Storage Strategy

- **In-Memory**: 모든 데이터는 서버의 메모리(`Map` 객체 등)에 저장.
- **Persistence**: 서버 재시작 시 데이터 소실 (Spec 허용사항).
- **Concurrency**: Node.js 싱글 스레드 특성상 기본 락 없이 처리 가능하나, Transaction 처리는 동기적으로 수행하여 정합성 보장.
