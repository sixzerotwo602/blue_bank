# Research: Game Connectivity

**Feature**: 004-game-connectivity  
**Date**: 2026-01-23

## Research Tasks

기존 Technical Context에서 NEEDS CLARIFICATION 항목이 없으므로, 주요 기술 결정 사항에 대한 Best Practices 연구를 수행합니다.

---

## 1. Socket.IO 재연결 전략

### Decision

Socket.IO 내장 재연결 기능 활용 + 커스텀 세션 복원 로직

### Rationale

- Socket.IO는 기본적으로 자동 재연결을 지원 (`reconnection: true`)
- 지수 백오프(Exponential Backoff) 전략이 내장되어 있음
- 세션 복원은 커스텀 로직이 필요 (닉네임 + 방 코드 기반 식별)

### Alternatives Considered

| Alternative                   | Rejected Because                       |
| ----------------------------- | -------------------------------------- |
| WebSocket Raw + 커스텀 재연결 | 불필요한 복잡성, Socket.IO가 이미 처리 |
| Heartbeat만 사용              | 재연결 로직 직접 구현 필요             |

---

## 2. 연결 상태 감지 방식

### Decision

Socket.IO `disconnect` 이벤트 + Heartbeat Polling (30초 간격)

### Rationale

- `disconnect` 이벤트로 즉시 감지 가능
- Heartbeat는 백업 메커니즘으로 좀비 세션 방지
- Socket.IO ping/pong이 기본 제공되므로 추가 구현 최소화

### Alternatives Considered

| Alternative              | Rejected Because                |
| ------------------------ | ------------------------------- |
| WebSocket close 이벤트만 | 네트워크 끊김 시 즉시 감지 불가 |
| 커스텀 ping/pong         | Socket.IO가 이미 제공           |

---

## 3. 세션 저장 방식 (MVP)

### Decision

In-Memory Map (기존 Store 클래스 확장)

### Rationale

- MVP 단계에서 단일 서버 운영
- 기존 `store.rooms` 구조 활용 가능
- 추후 Redis 등으로 마이그레이션 용이한 구조

### Alternatives Considered

| Alternative               | Rejected Because      |
| ------------------------- | --------------------- |
| Redis                     | MVP에서 과도한 복잡성 |
| LocalStorage (클라이언트) | 서버 측 검증 불가     |
| Database                  | 실시간 성능에 부적합  |

---

## 4. 호스트 이전 타이머 구현

### Decision

`setTimeout` + 이벤트 기반 취소

### Rationale

- 2분 대기 후 호스트 이전 실행
- 원래 호스트 재접속 시 타이머 취소
- Node.js 기본 기능으로 충분

### Alternatives Considered

| Alternative   | Rejected Because        |
| ------------- | ----------------------- |
| Cron/스케줄러 | 단순 딜레이에 과도함    |
| 즉시 이전     | 일시적 끊김에 혼란 유발 |

---

## 5. 연결 상태 UI 표현

### Decision

컬러 인디케이터 + 텍스트 라벨

### Rationale

- 🟢 ONLINE (녹색)
- 🔴 OFFLINE (빨간색)
- 🟡 RECONNECTING (노란색, 애니메이션)
- 직관적이고 색맹 사용자를 위해 텍스트 병행

### Alternatives Considered

| Alternative | Rejected Because      |
| ----------- | --------------------- |
| 아이콘만    | 접근성 문제           |
| 텍스트만    | 시각적 인지 속도 저하 |

---

## Summary

모든 기술 결정이 완료되었으며 NEEDS CLARIFICATION 항목이 없습니다.

| 영역   | 결정                              |
| ------ | --------------------------------- |
| 재연결 | Socket.IO 내장 + 커스텀 세션 복원 |
| 감지   | disconnect 이벤트 + Heartbeat     |
| 저장   | In-Memory Map (Store 확장)        |
| 타이머 | setTimeout + 이벤트 취소          |
| UI     | 컬러 + 텍스트 라벨                |
