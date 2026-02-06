# Quickstart: 백엔드 리팩토링

**Feature**: 010-backend-refactor | **Date**: 2026-02-06

## 변경 요약

1. **신규 파일 3개**: `backend/src/utils/` 디렉토리에 constants.ts, helpers.ts, timer-manager.ts
2. **수정 파일 ~12개**: handlers 5개, services 4개, models 1개, shared 타입 1개, app.ts
3. **삭제 대상**: dead code (heartbeat 핸들러, lastSeenAt 필드, room:rejoin 핸들러)
4. **프론트엔드 변경**: 없음

## 구현 순서

```
Phase A: 기반 구축
  └─ constants.ts → helpers.ts → timer-manager.ts → 기존 코드 교체
       │
Phase B: Store 인덱스
  └─ 인덱스 Map 추가 → 갱신 로직 → 조회 교체
       │
Phase C: 세션/재접속 정비        Phase D: 비즈니스 로직 분리
  └─ LOBBY 재접속 수정             └─ 랭킹 통합, switch 분리
  └─ restoreSession 개선
  └─ 유령 정리, dead code 제거
       │                              │
Phase E: 메모리 관리 ─────────────────┘
  └─ cleanupRoom() → 타이머 스케줄링
       │
Phase F: 타입 안전성 + 마무리
  └─ non-null assertion 제거 → 빌드 확인
```

## 주요 파일별 변경

### 신규: backend/src/utils/constants.ts

```typescript
// 모든 매직넘버를 중앙 상수로 관리
export const VOTE_TIMEOUT_MS = 60_000;
export const CANCEL_REQUEST_TIMEOUT_MS = 60_000;
export const HOST_MIGRATION_DELAY_MS = 120_000;
export const SESSION_EXPIRY_MS = 300_000;
export const ROOM_CLEANUP_DELAY_MS = 300_000;
export const SESSION_CLEANUP_INTERVAL_MS = 60_000;
export const KICK_GRACE_PERIOD_MS = 300_000;
```

### 신규: backend/src/utils/helpers.ts

```typescript
import { store } from '../models/store.js';

// getRoomId: 7곳 중복을 단일 함수로 통합
export function getRoomId(playerId: string): string | null {
  return store.playerToRoom.get(playerId) ?? null;
}

// formatManwon: 금액 포맷팅
export function formatManwon(amount: number): string {
  return `${amount}만원`;
}
```

### 신규: backend/src/utils/timer-manager.ts

```typescript
export class TimerManager {
  private timers = new Map<string, NodeJS.Timeout>();

  set(key: string, callback: () => void, delay: number): void {
    this.clear(key); // 기존 타이머 자동 해제
    this.timers.set(key, setTimeout(callback, delay));
  }

  clear(key: string): void {
    const timer = this.timers.get(key);
    if (timer) { clearTimeout(timer); this.timers.delete(key); }
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.timers.keys()) {
      if (key.startsWith(prefix)) this.clear(key);
    }
  }

  has(key: string): boolean { return this.timers.has(key); }

  clearAll(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }
}

export const timerManager = new TimerManager();
```

### 수정: backend/src/models/store.ts

- 인덱스 Map 3개 추가 (playerToRoom, roomTransactions, playerNotifications)
- voteTimeouts Map 삭제 (TimerManager 대체)
- cleanupRoom(roomId) 메서드 추가
- reset()에 인덱스 초기화 + TimerManager.clearAll() 추가

### 수정: shared/src/index.ts

- Player 인터페이스에서 `lastSeenAt` 필드 삭제
- ClientToServerEvents에서 `connection:heartbeat`, `room:rejoin` 이벤트 삭제

## 테스트 전략

### 회귀 테스트 (필수)
- 모든 거래 타입(8종) 동작 확인
- 투표(3종) 동작 확인
- 방 생성/참가/게임 시작/종료 흐름

### 신규 테스트
- TimerManager: set/clear/clearByPrefix/동일 키 재등록
- Store 인덱스: 입장/퇴장/재접속 시 갱신 확인
- cleanupRoom: 관련 데이터 전체 삭제 확인
- 세션 복원: LOBBY/PLAYING 상태별 재접속
- 메모리: 게임 100회 생성/종료 후 힙 메모리 확인

## 검증 명령어

```bash
# 빌드 확인
cd backend && npm run build

# 테스트 실행
cd backend && npm test

# non-null assertion 검사
grep -rn '!.' backend/src/ --include='*.ts' | grep -v 'node_modules' | grep -v '!=' | grep -v '!//'

# 매직넘버 검사 (타임아웃 관련)
grep -rn '60000\|120000\|300000' backend/src/ --include='*.ts' | grep -v constants.ts
```
