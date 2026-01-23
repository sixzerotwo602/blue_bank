# Socket.IO Events Contract: Game Connectivity

**Feature**: 004-game-connectivity  
**Date**: 2026-01-23

## Client → Server Events

### connection:heartbeat

클라이언트가 주기적으로 전송하는 heartbeat

```typescript
socket.emit('connection:heartbeat');
```

**Response**: None (서버가 lastSeenAt 업데이트)

---

### room:rejoin

연결이 끊긴 플레이어가 재접속 시도

```typescript
socket.emit('room:rejoin', roomId: string, nickname: string, (response) => {
    // response: { success: boolean, message?: string }
});
```

**Success Conditions**:

- 해당 닉네임의 DisconnectedSession이 존재
- 유예 기간(5분) 내 시도
- roomId가 일치

**Response**:

```typescript
{ success: true }  // 세션 복원 성공
{ success: false, message: '세션이 만료되었습니다' }
{ success: false, message: '방을 찾을 수 없습니다' }
```

---

### player:kick

호스트가 오프라인 플레이어 강제 퇴장

```typescript
socket.emit('player:kick', playerId: string, (response) => {
    // response: { success: boolean, message?: string }
});
```

**Validation**:

- 요청자가 호스트여야 함
- 대상 플레이어가 5분 이상 OFFLINE 상태여야 함

**Response**:

```typescript
{ success: true }
{ success: false, message: '호스트만 퇴장시킬 수 있습니다' }
{ success: false, message: '해당 플레이어는 아직 퇴장 대상이 아닙니다' }
```

---

## Server → Client Events

### connection:status

플레이어 연결 상태 변경 알림

```typescript
socket.on('connection:status', (payload) => {
  // payload: { playerId: string, status: ConnectionStatus, nickname: string }
});
```

**Trigger**: 플레이어 연결/해제/재연결 시

---

### host:migrating

호스트 이전 대기 시작 알림

```typescript
socket.on('host:migrating', (payload) => {
  // payload: { disconnectedHostId: string, remainingSeconds: number }
});
```

**Trigger**: 호스트 연결 끊김 감지 시

---

### host:migrated

호스트 이전 완료 알림

```typescript
socket.on('host:migrated', (payload) => {
  // payload: { oldHostId: string, newHostId: string, newHostNickname: string }
});
```

**Trigger**: 2분 대기 후 호스트 이전 실행 시

---

### host:migration_cancelled

호스트 이전 취소 알림 (원래 호스트 복귀)

```typescript
socket.on('host:migration_cancelled', (payload) => {
  // payload: { hostId: string, hostNickname: string }
});
```

**Trigger**: 호스트가 2분 내 재접속 시

---

### player:kicked

플레이어 강제 퇴장 알림

```typescript
socket.on('player:kicked', (payload) => {
  // payload: { playerId: string, nickname: string }
});
```

**Trigger**: 호스트가 플레이어 강제 퇴장 시

---

### player:rejoined

플레이어 재접속 완료 알림

```typescript
socket.on('player:rejoined', (payload) => {
  // payload: { playerId: string, nickname: string }
});
```

**Trigger**: 유예 기간 내 재접속 성공 시

---

## Type Definitions (shared/src/index.ts)

```typescript
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export interface ConnectionStatusPayload {
  playerId: string;
  status: ConnectionStatus;
  nickname: string;
}

export interface HostMigratingPayload {
  disconnectedHostId: string;
  remainingSeconds: number;
}

export interface HostMigratedPayload {
  oldHostId: string;
  newHostId: string;
  newHostNickname: string;
}

export interface PlayerKickedPayload {
  playerId: string;
  nickname: string;
}

// ClientToServerEvents 확장
export interface ClientToServerEvents {
  // ... 기존 이벤트
  'connection:heartbeat': () => void;
  'room:rejoin': (
    roomId: string,
    nickname: string,
    callback: (res: { success: boolean; message?: string }) => void,
  ) => void;
  'player:kick': (
    playerId: string,
    callback: (res: { success: boolean; message?: string }) => void,
  ) => void;
}

// ServerToClientEvents 확장
export interface ServerToClientEvents {
  // ... 기존 이벤트
  'connection:status': (payload: ConnectionStatusPayload) => void;
  'host:migrating': (payload: HostMigratingPayload) => void;
  'host:migrated': (payload: HostMigratedPayload) => void;
  'host:migration_cancelled': (payload: {
    hostId: string;
    hostNickname: string;
  }) => void;
  'player:kicked': (payload: PlayerKickedPayload) => void;
  'player:rejoined': (payload: { playerId: string; nickname: string }) => void;
}
```
