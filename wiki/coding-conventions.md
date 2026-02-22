# 코딩 컨벤션 및 패턴

> 코드 일관성을 유지하기 위한 규칙과 패턴을 정리한다.

---

## 언어 규칙

- **한국어**: 코드 주석, 커밋 메시지, PR 설명, 에러 메시지
- **영어**: 변수명, 함수명, 타입명 등 코드 식별자

```typescript
// 좋은 예
/** 플레이어가 방의 호스트인지 확인한다 */
export function isRoomHost(socketId: string, room: Room): boolean { ... }

// 나쁜 예
/** Check if the player is the host of the room */
export function 방장확인(socketId: string, room: Room): boolean { ... }
```

---

## ESM 모듈 규칙 (백엔드)

백엔드는 ESM 모듈을 사용한다. import 경로에 **`.js` 확장자**를 반드시 붙인다:

```typescript
// 올바른 import
import { memoryStore } from '../infrastructure/persistence/memory-store.js';
import { validate } from '../utils/validation.js';

// 잘못된 import (빌드 실패)
import { memoryStore } from '../infrastructure/persistence/memory-store';
```

---

## Companion Module 패턴

클래스 래핑 대신 **plain object + companion 순수 함수**를 사용한다. 도메인 로직은 순수 함수로 표현하고, 상태를 직접 변경하는 메서드는 사용하지 않는다.

```typescript
// 좋은 예: 순수 함수
export function createPlayer(id: string, nickname: string, isHost: boolean): Player {
  return { id, nickname, cash: 0, assetValue: 0, assets: [], ... };
}

// 나쁜 예: 클래스 메서드
class PlayerEntity {
  constructor(public id: string, ...) {}
  updateCash(amount: number) { this.cash += amount; }
}
```

---

## 타입 관리

### shared 패키지 중앙화

모든 공유 타입은 `shared/src/index.ts`에 정의한다. 프론트엔드와 백엔드 모두 이 패키지를 참조한다.

```typescript
// shared에서 import
import type { Player, Room, Transaction } from 'blue-bank-shared';
```

### `import type` 사용

타입만 사용하는 경우 `import type`을 사용하여 런타임 번들에 포함되지 않게 한다:

```typescript
import type { Room, Player } from 'blue-bank-shared';
```

---

## 에러 처리 패턴

### 핸들러: try-catch + callback

핸들러에서는 try-catch로 감싸고, 콜백으로 에러를 반환한다:

```typescript
try {
  const data = validate<{ roomId: string }>('room:get', { roomId });
  const room = gameUseCases.getRoom(data.roomId);
  callback({ room });
} catch (error) {
  callback({ error: error instanceof Error ? error.message : '알 수 없는 오류' });
}
```

### 도메인: 예외 throw

도메인 함수에서는 유효하지 않은 상태에 대해 예외를 throw한다. 핸들러가 이를 catch한다:

```typescript
// 도메인 함수
export function processTransaction(room: Room, tx: TxRequest): Transaction {
  if (player.cash < tx.amount) {
    throw new Error('잔액이 부족합니다');
  }
  // ...
}
```

---

## 파일 네이밍 규칙

| 패턴 | 위치 | 예시 |
|------|------|------|
| `*.handler.ts` | `backend/src/handlers/` | `room.handler.ts`, `game.handler.ts` |
| `*.use-cases.ts` | `backend/src/application/` | `game.use-cases.ts`, `voting.use-cases.ts` |
| `*.operations.ts` | `backend/src/domain/*/` | `room.operations.ts`, `vote.operations.ts` |
| `*.repository.ts` | `backend/src/domain/*/` | `room.repository.ts` (인터페이스) |
| `*.repository.impl.ts` | `backend/src/infrastructure/persistence/` | `room.repository.impl.ts` (구현체) |
| 컴포넌트 PascalCase | `frontend/src/` | `BaseButton.tsx`, `TransactionModal.tsx` |
| hooks camelCase | `frontend/src/hooks/` | `useGame.ts`, `useSocket.ts` |

---

## Socket.io 이벤트 네이밍

**`namespace:action`** 형식을 사용한다:

```
room:create          # 방 생성
room:join            # 방 입장
game:start           # 게임 시작
tx:request           # 거래 요청
vote:cast            # 투표
notification:mark_read  # 알림 읽음
```

복합 네임스페이스 예시:
```
game_end_vote:cast       # 게임 종료 투표 응답
bank_receive_vote:started # 은행 수령 투표 시작
tx:cancel_requested      # 거래 취소 요청 수신
```

---

## 상수 관리

모든 상수는 `backend/src/utils/constants.ts`에 집중한다.

### 시간 상수: `_MS` 접미사

```typescript
export const VOTE_TIMEOUT_MS = 60_000;          // 60초
export const HOST_MIGRATION_DELAY_MS = 120_000; // 2분
export const SESSION_EXPIRY_MS = 300_000;       // 5분
```

### 제한값 상수: `MAX_` 접두사

```typescript
export const MAX_AMOUNT = 1_000_000_000;   // 10억
export const MAX_NICKNAME_LENGTH = 20;
export const MAX_PLAYERS_PER_ROOM = 10;
export const MAX_ROOMS_PER_IP = 5;
```

### 숫자 구분자

큰 숫자는 `_` 구분자로 가독성을 높인다:

```typescript
60_000     // 60,000 (60초)
1_000_000_000  // 1,000,000,000 (10억)
```

---

## 금액 단위

- **내부 연산**: 항상 **원(won)** 단위 (정수)
- **화면 표시**: `formatManwon()` 함수로 만원 단위 변환

```typescript
// 내부: 원 단위 정수
player.cash = 200_000;  // 20만원

// 표시: formatManwon
formatManwon(200_000)  // → '20만원'
formatManwon(0)        // → '0원'
formatManwon(12_345)   // → '1.23만원'
```

프론트엔드에서는 `MoneyFormatContext`를 통해 만원/원 표시를 토글할 수 있다.

---

## 참조

- [`CLAUDE.md`](../CLAUDE.md) — AI 어시스턴트 개발 지침
- [`backend/src/utils/constants.ts`](../backend/src/utils/constants.ts) — 상수 정의
- [`shared/src/index.ts`](../shared/src/index.ts) — 공유 타입 정의
