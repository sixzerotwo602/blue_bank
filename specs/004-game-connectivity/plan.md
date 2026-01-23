# Implementation Plan: Game Connectivity

**Branch**: `004-game-connectivity` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-game-connectivity/spec.md`

## Summary

게임 연결성 기능은 플레이어 연결 상태 실시간 표시, 재접속 및 세션 복원(5분 유예), 호스트 자동 이전(2분 대기), 플레이어 강제 퇴장, 자동 재연결을 구현합니다. 기존 Socket.IO 기반 실시간 통신 아키텍처를 확장하여 연결 관리 기능을 추가합니다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (LTS)  
**Primary Dependencies**: Socket.IO (서버/클라이언트), React 18, TailwindCSS  
**Storage**: In-Memory Map (기존 Store 클래스 확장) - MVP 단계  
**Testing**: Vitest (Frontend), Manual Testing (Backend)  
**Target Platform**: Web (모바일 브라우저 포함)  
**Project Type**: Web Application (Frontend + Backend monorepo)  
**Performance Goals**: 연결 상태 변경 3초 이내 반영, 재연결 시도 5초 이내 시작  
**Constraints**: 유예 기간 5분, 호스트 이전 대기 2분, 자동 재연결 최대 5회  
**Scale/Scope**: ~10 동시 플레이어/방, 단일 서버 MVP

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Simplicity & Efficiency

| Principle | Status  | Notes                                                                     |
| --------- | ------- | ------------------------------------------------------------------------- |
| KISS      | ✅ PASS | Socket.IO 기본 이벤트 활용, 단순한 상태 머신(ONLINE/OFFLINE/RECONNECTING) |
| YAGNI     | ✅ PASS | 필수 기능만 구현 (분산 세션, Redis 등 제외)                               |
| DRY       | ✅ PASS | 연결 관리 로직을 ConnectionService로 단일화                               |

### II. Structure & Design

| Principle | Status  | Notes                                                                             |
| --------- | ------- | --------------------------------------------------------------------------------- |
| SRP       | ✅ PASS | ConnectionService(연결), SessionService(세션 복원), HostService(호스트 이전) 분리 |
| OCP       | ✅ PASS | 기존 Room/Player 모델 확장, 기존 핸들러 수정 최소화                               |
| SoC       | ✅ PASS | 백엔드(상태 관리) / 프론트엔드(UI 표시) 명확히 분리                               |

### III. Collaboration & Intuitiveness

| Principle          | Status  | Notes                                             |
| ------------------ | ------- | ------------------------------------------------- |
| Boy Scout Rule     | ✅ PASS | 기존 Room/Player 타입 정리, 미사용 코드 제거 기회 |
| Least Astonishment | ✅ PASS | 연결 상태 아이콘, 재연결 진행 상황 등 직관적 UX   |

**Gate Result**: ✅ PASS - 모든 원칙 준수

## Project Structure

### Documentation (this feature)

```text
specs/004-game-connectivity/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── socket-events.md # Socket.IO 이벤트 계약
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── store.ts           # [MODIFY] Player에 연결 상태 필드 추가
│   ├── services/
│   │   ├── connection.service.ts  # [NEW] 연결 상태 관리
│   │   └── room.service.ts        # [MODIFY] 재접속/호스트 이전 로직
│   └── handlers/
│       └── connection.handler.ts  # [NEW] 연결 관련 이벤트 핸들러
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── ConnectionStatus.tsx   # [NEW] 연결 상태 아이콘
│   │   └── ReconnectOverlay.tsx   # [NEW] 재연결 진행 UI
│   ├── hooks/
│   │   └── useSocket.ts           # [MODIFY] 재연결 로직 추가
│   └── pages/
│       ├── Lobby.tsx              # [MODIFY] 연결 상태 표시
│       └── Dashboard.tsx          # [MODIFY] 연결 상태/강제 퇴장 UI
└── tests/

shared/
└── src/
    └── index.ts                   # [MODIFY] 연결 관련 타입 추가
```

**Structure Decision**: 기존 Web Application 구조(frontend/backend/shared) 유지. 연결 관리 로직은 새로운 서비스(`connection.service.ts`)로 분리하여 SRP 준수.

## Complexity Tracking

> 위반 사항 없음 - 모든 Constitution Check 통과
