# Implementation Plan: 부루마불 은행 동반 앱

**Branch**: `001-blue-marble-bank` | **Date**: 2026-01-23 | **Spec**: [specs/001-blue-marble-bank/spec.md](specs/001-blue-marble-bank/spec.md)
**Input**: Feature specification from `/specs/001-blue-marble-bank/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

부루마불 보드게임을 위한 "은행" 역할 수행 웹 애플리케이션입니다. 사용자(플레이어)는 QR/코드로 방에 입장하며, 실시간으로 송금, 자산 구매, 복지기금 기부 및 투표 기능을 수행합니다. 기술적으로는 Node.js + Socket.io를 이용한 실시간 양방향 통신과 React + Tailwind CSS 기반의 모바일 친화적 대시보드를 구축하며, 데이터는 메모리상에서 관리되어 가볍고 빠른 세션을 지원합니다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (LTS)
**Primary Dependencies**:

- Backend: Socket.io, Express (minimal), ts-node/tsx
- Frontend: React 18+, Vite, Tailwind CSS, socket.io-client
  **Storage**: In-Memory (JavaScript Objects/Maps) - _No persistent database per requirements_
  **Testing**: Vitest (Unified runner), React Testing Library (Frontend), socket.io-client (Integration)
  **Target Platform**: Mobile Web (Responsive Design focus)
  **Project Type**: Web Application (Monorepo-style structure)
  **Performance Goals**: <100ms interaction latency, <1s broadcast synchronization
  **Constraints**: Stateless backend (data lost on restart), Strict type safety (Shared DTOs)
  **Scale/Scope**: Real-time sync for 4+ players per room

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Simplicity & Efficiency (KISS/YAGNI)**:
  - DB 레이어를 제거하고 인메모리 저장소 사용.
  - 복잡한 상태 관리 라이브러리 대신 Context API/Socket state 사용 예정.
- [x] **Structure & Design (SoC)**:
  - **Backend**: Socket 이벤트 핸들러와 게임 로직 분리.
  - **Frontend**: UI 컴포넌트와 Socket 통신 로직(Custom Hooks) 분리.
- [x] **Collaboration (SOLID)**:
  - 명확한 인터페이스 정의(Shared DTO)를 통해 프론트/백엔드 간 계약 준수.

## Project Structure

### Documentation (this feature)

```text
specs/001-blue-marble-bank/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Option 2: Web application (Frontend + Backend)
backend/
├── src/
│   ├── models/    # Shared types/interfaces & In-memory store classes
│   ├── services/  # Game logic (Banking, Voting, Room management)
│   ├── handlers/  # Socket.io event controllers
│   ├── app.ts     # Server entrypoint
│   └── utils/
└── tests/         # Vitest integration/unit tests

frontend/
├── src/
│   ├── components/ # Atomic UI components (Tailwind styled)
│   ├── pages/      # Route pages (Home, Room, Dashboard)
│   ├── hooks/      # useSocket, useGame logic
│   └── services/   # API/Socket wrapper
└── tests/          # Component tests
```

**Structure Decision**: **Option 2 (Web Application)**. 클라이언트(React)와 서버(Node.js)가 명확히 분리된 구조를 채택하여 관심사의 분리(SoC)를 실현하고 각 환경에 최적화된 빌드/배포 프로세스를 지원합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (None)    |            |                                      |
