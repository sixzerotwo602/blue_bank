# Socket.io Events Contract: 백엔드 리팩토링

**Feature**: 010-backend-refactor | **Date**: 2026-02-06

## 변경 원칙

기존 Socket.io 이벤트 인터페이스(ServerToClientEvents, ClientToServerEvents)를 **최대한 유지**한다.
이번 리팩토링에서의 이벤트 변경은 **dead code 제거만** 해당한다.

## ClientToServerEvents 변경사항

### 제거 대상

#### ~~connection:heartbeat~~

```typescript
// 삭제: 프론트엔드에서 미전송, 백엔드에서 미사용 dead code
// 기존: 'connection:heartbeat': () => void;
```

#### ~~room:rejoin~~

```typescript
// 삭제: 프론트엔드에서 미사용, room:join으로 통합
// 기존: 'room:rejoin': (roomId: string, nickname: string, callback: (res: {...}) => void) => void;
```

### 동작 변경 (인터페이스 유지)

#### room:join (재접속 통합)

```typescript
// 인터페이스 변경 없음
'room:join': (
  roomId: string,
  nickname: string,
  callback: (response: { success: boolean; message?: string; roomId?: string; }) => void
) => void;
```

**동작 변경**:
- 기존: LOBBY 상태에서 닉네임 중복 시 무조건 `{ success: false, message: 'Nickname taken' }`
- 변경: LOBBY 상태에서 닉네임 중복 + 기존 플레이어 OFFLINE → 세션 복원 후 `{ success: true }`
- 기존: PLAYING 상태에서 "Game already started" → restoreSession (스냅샷 기반)
- 변경: PLAYING 상태에서 "Game already started" → restoreSession (room.players 실시간 기반)

## ServerToClientEvents 변경사항

변경 없음. 기존 33개 이벤트 모두 유지.

## shared/src/index.ts 타입 변경사항

### Player 인터페이스

```typescript
export interface Player {
  id: string;
  nickname: string;
  cash: number;
  assetValue: number;
  assets: Asset[];
  isHost: boolean;
  connected: boolean;
  connectionStatus: ConnectionStatus;
  // lastSeenAt: number;  // 삭제
  disconnectedAt: number | null;
}
```

### ClientToServerEvents

```typescript
export interface ClientToServerEvents {
  // ... 기존 이벤트 유지 ...
  // 'connection:heartbeat': () => void;  // 삭제
  // 'room:rejoin': (...) => void;        // 삭제
}
```

## 이벤트 수 요약

| 구분 | 기존 | 변경 후 | 변경 |
|------|------|---------|------|
| ClientToServerEvents | 26 | 24 | -2 (heartbeat, rejoin 제거) |
| ServerToClientEvents | 33 | 33 | 변경 없음 |
| Player 필드 | 11 | 10 | -1 (lastSeenAt 제거) |
