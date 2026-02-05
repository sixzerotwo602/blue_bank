# Implementation Plan: UX 버그 수정 및 기능 개선 v2

**Branch**: `009-ux-bugfix-v2` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-ux-bugfix-v2/spec.md`

## Summary

6개 GitHub 이슈(#23-#28)를 해결하는 UX 버그 수정 및 기능 개선 작업. 주요 내용:
1. 송금 모달 UI 버튼 활성화 로직 수정
2. 게임 종료 투표 취소 동기화 개선
3. 토지 매각 시 건물 일괄 처리 로직 추가
4. 은행에서 돈 받기 투표 시스템 도입
5. 거래 취소 기능 구현
6. 자산명 수정 기능 추가
7. 모든 투표 타임아웃 시 자동 거절 처리로 통일

## Technical Context

**Language/Version**: TypeScript 5.x (Backend: 5.9.3, Frontend: 5.3.3)
**Primary Dependencies**:
- Backend: Express 5.x, Socket.io 4.x
- Frontend: React 18.2, Vite 5.x, Tailwind CSS 3.4, react-hot-toast
- Shared: @blue-banker/shared (공용 타입 정의)

**Storage**: In-memory (Map 기반 Store 클래스)
**Testing**: Vitest (Backend & Frontend)
**Target Platform**: Web (모바일 브라우저 포함)
**Project Type**: Web Application (Monorepo: backend, frontend, shared)
**Performance Goals**: 실시간 WebSocket 통신, 즉각적인 UI 반응
**Constraints**: 60초 투표 타임아웃, 동시 투표 1개 제한
**Scale/Scope**: 2-8명 동시 플레이어, 단일 게임 세션

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

프로젝트 Constitution이 템플릿 상태이므로 기본 원칙 적용:
- ✅ 기존 코드 패턴 준수 (Handler → Service → Store)
- ✅ 공유 타입은 @blue-banker/shared에 정의
- ✅ Socket.io 이벤트 기반 실시간 통신
- ✅ React 컴포넌트 기반 UI

## Project Structure

### Documentation (this feature)

```text
specs/009-ux-bugfix-v2/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Socket events)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── handlers/
│   │   ├── vote.handler.ts        # 투표 관련 소켓 핸들러 수정
│   │   ├── transaction.handler.ts # 거래 취소 핸들러 추가
│   │   └── game.handler.ts        # 게임 종료 투표 타임아웃 수정
│   ├── services/
│   │   ├── vote.service.ts        # 투표 타임아웃 로직 수정
│   │   └── transaction.service.ts # 거래 취소 서비스 추가
│   └── models/
│       └── store.ts               # 거래 취소 요청 저장소 추가
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── TransactionModal.tsx      # 송금 버튼 활성화 로직 수정
│   │   ├── TransactionHistory.tsx    # 거래 취소 버튼 추가
│   │   ├── GameEndVotePopup.tsx      # 모달 닫힘 방지 로직 추가
│   │   ├── SellAssetModal.tsx        # 건물 일괄 매각 경고 추가
│   │   ├── BankReceiveModal.tsx      # 은행 수령 → 투표 시스템 전환
│   │   ├── BankReceiveVotePopup.tsx  # [NEW] 은행 수령 투표 모달
│   │   ├── CancelRequestPopup.tsx    # [NEW] 거래 취소 요청 모달
│   │   ├── PlayerAssetModal.tsx      # 자산명 수정 기능 추가
│   │   └── VotePopup.tsx             # 투표 타임아웃 UI 표시
│   ├── pages/
│   │   └── Dashboard.tsx             # 용어 변경 ('수령' → '은행에서 돈 받기')
│   └── hooks/
│       └── useGame.ts                # 새로운 소켓 이벤트 핸들링
└── tests/

shared/
└── src/
    └── index.ts                      # 새로운 타입 정의 추가
```

**Structure Decision**: 기존 Monorepo 구조 유지. 대부분 기존 파일 수정으로 진행하며, 거래 취소 관련 새로운 타입과 소켓 이벤트만 추가.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 없음 | N/A | N/A |

기존 아키텍처 패턴을 그대로 따르므로 복잡도 증가 없음.
