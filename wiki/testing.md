# 테스트 전략

> Vitest 기반 테스트 전략. 단위/통합/E2E 테스트 범위와 작성 지침을 정리한다.

---

## 도구

- **Vitest** — Vite 기반 테스트 러너 (Jest 호환 API)

```bash
# 전체 테스트 실행
npm test

# 감시 모드
npm test -- --watch
```

---

## 테스트 피라미드

```
        ┌─────────┐
        │  E2E    │  Socket.io 핸들러
        │ (적음)   │  전체 이벤트 흐름
        ├─────────┤
        │  통합   │  UseCases + MemoryStore
        │ (보통)   │  리포지토리 연동
        ├─────────┤
        │  단위   │  Domain 순수 함수
        │ (많음)   │  operations.ts
        └─────────┘
```

---

## 단위 테스트 (최우선)

### 대상: Domain 순수 함수

DDD 아키텍처의 Domain 계층은 외부 의존성이 없는 순수 함수로 구성되어 단위 테스트에 가장 적합하다.

### 테스트 대상 파일

| 파일 | 테스트 내용 |
|------|-----------|
| `domain/game/room.operations.ts` | 방 생성, 참여, 상태 전환, 호스트 마이그레이션 |
| `domain/game/player.operations.ts` | 플레이어 생성, 현금/자산 변경, 연결 상태 |
| `domain/transaction/transaction.operations.ts` | 거래 생성, 금액 계산, 자산 매매 |
| `domain/transaction/cancel.operations.ts` | 거래 취소 요청/승인/거절 |
| `domain/voting/vote.operations.ts` | 투표 생성, 캐스팅, 결과 판정 |
| `domain/voting/game-end-vote.operations.ts` | 게임 종료 투표 |
| `domain/notification/notification.operations.ts` | 알림 생성, 읽음 처리 |

### 예시 구조

```typescript
// backend/tests/domain/room.operations.test.ts
import { describe, it, expect } from 'vitest';
import { createRoom, addPlayerToRoom } from '../../src/domain/game/room.operations.js';

describe('createRoom', () => {
  it('호스트 플레이어가 포함된 LOBBY 상태의 방을 생성한다', () => {
    const room = createRoom('socket-1', '테스트유저');

    expect(room.status).toBe('LOBBY');
    expect(room.players).toHaveLength(1);
    expect(room.players[0].isHost).toBe(true);
    expect(room.players[0].nickname).toBe('테스트유저');
  });
});
```

---

## 통합 테스트

### 대상: UseCases + MemoryStore

UseCases 클래스가 리포지토리를 통해 MemoryStore와 올바르게 상호작용하는지 검증한다.

### 테스트 대상

| UseCases | 테스트 내용 |
|----------|-----------|
| `GameUseCases` | 방 생성/참여, 게임 시작/종료, 세션 복구 |
| `TransactionUseCases` | 거래 처리, 잔액 검증, 취소 흐름 |
| `VotingUseCases` | 투표 생성 → 캐스팅 → 결과 처리 → 거래 생성 |
| `NotificationUseCases` | 알림 생성, 읽음 처리, 조회 |

### 설정

```typescript
// 각 테스트 전 MemoryStore 초기화
import { memoryStore } from '../../src/infrastructure/persistence/memory-store.js';

beforeEach(() => {
  memoryStore.reset();
});
```

---

## E2E 테스트

### 대상: Socket.io 핸들러

실제 Socket.io 클라이언트를 사용하여 전체 이벤트 흐름을 검증한다.

### 테스트 시나리오

| 시나리오 | 흐름 |
|---------|------|
| 방 생성 → 입장 → 게임 시작 | room:create → room:join → game:start |
| 거래 흐름 | tx:request → tx:processed 수신 → room:sync |
| 투표 흐름 | vote:request_fund → vote:started → vote:cast → vote:ended |
| 재연결 | disconnect → room:join (닉네임 동일) → player:rejoined |
| 거래 취소 | tx:request_cancel → tx:cancel_requested → tx:respond_cancel |

### 설정 예시

```typescript
import { io as ioc, Socket } from 'socket.io-client';

let server: ReturnType<typeof createServer>;
let clientSocket: Socket;

beforeAll(async () => {
  // 테스트용 서버 시작
  server = await startTestServer(0); // 임의 포트
});

afterAll(() => {
  server.close();
  clientSocket?.disconnect();
});
```

---

## 테스트 작성 지침

### 파일명

```
backend/tests/domain/<도메인>/<파일명>.test.ts     # 단위
backend/tests/application/<use-cases>.test.ts      # 통합
backend/tests/handlers/<handler>.test.ts           # E2E
```

### 구조 (AAA 패턴)

```typescript
describe('기능 그룹', () => {
  it('한국어로 기대 동작을 설명한다', () => {
    // Arrange (준비)
    const room = createRoom('host-1', '호스트');

    // Act (실행)
    const result = addPlayerToRoom(room, 'player-1', '플레이어');

    // Assert (검증)
    expect(result.players).toHaveLength(2);
  });
});
```

### describe/it 설명

- **한국어**로 작성한다
- `describe`: 함수명 또는 기능 그룹
- `it`: "~한다" 형태의 기대 동작

```typescript
describe('processTransaction', () => {
  it('잔액이 부족하면 에러를 throw한다', () => { ... });
  it('송금 성공 시 양쪽 잔액을 정확히 변경한다', () => { ... });
  it('BANK 거래는 발신자 잔액을 변경하지 않는다', () => { ... });
});
```

---

## 현재 상태 및 로드맵

### 현재

- `tests/` 디렉토리 존재
- Domain 순수 함수 기반 단위 테스트 확장 중

### 로드맵

| 우선순위 | 대상 | 이유 |
|---------|------|------|
| 1 | Domain 순수 함수 단위 테스트 | 외부 의존성 없어 작성 용이, 핵심 로직 보호 |
| 2 | UseCases 통합 테스트 | 리포지토리 연동 검증 |
| 3 | 핸들러 E2E 테스트 | 전체 흐름 검증, 회귀 방지 |

---

## 참조

- [`backend/src/domain/`](../backend/src/domain/) — 단위 테스트 대상 순수 함수
- [`backend/src/application/`](../backend/src/application/) — 통합 테스트 대상 UseCases
- [`backend/src/handlers/`](../backend/src/handlers/) — E2E 테스트 대상 핸들러
