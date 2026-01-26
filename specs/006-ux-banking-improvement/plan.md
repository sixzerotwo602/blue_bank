# Implementation Plan: UX 뱅킹 개선

**Branch**: `006-ux-banking-improvement` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ux-banking-improvement/spec.md`

## Summary

UX 뱅킹 경험 개선을 위한 4가지 주요 변경사항 구현:
1. 송금 모달에서 "플레이어에게 송금" / "은행으로 송금" 버튼 분리 (색상 구분)
2. 실시간 랭킹에서 토지/건물 개수와 평가액 병기
3. 건물 유형(호텔/빌딩/별장) 구분을 위한 타입 확장 및 UI 표시
4. "비용 지불" → "은행에 납부" 용어 통일

## Technical Context

**Language/Version**: TypeScript 5.x (monorepo: shared, backend, frontend)
**Primary Dependencies**:
- Frontend: React 18, Vite, Tailwind CSS, Socket.io-client
- Backend: Express 5, Socket.io
- Shared: TypeScript types/interfaces
**Storage**: In-memory (Socket.io 기반 실시간 게임)
**Testing**: Vitest (frontend & backend)
**Target Platform**: Web (모바일 반응형 우선)
**Project Type**: Web application (monorepo)
**Performance Goals**: UI 변경만, 성능 영향 없음
**Constraints**: 320px 최소 화면 너비 지원
**Scale/Scope**: 기존 컴포넌트 수정, 새 파일 생성 없음

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

프로젝트 constitution이 플레이스홀더 상태이므로 기본 원칙 적용:
- ✅ 기존 코드 구조 유지
- ✅ 타입 안전성 유지 (shared 패키지 활용)
- ✅ 테스트 가능한 단위로 분리

## Project Structure

### Documentation (this feature)

```text
specs/006-ux-banking-improvement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Web application (monorepo)
shared/
└── src/
    └── index.ts           # Asset 타입에 buildingType 추가

backend/
└── src/
    └── handlers/
        └── transaction.handler.ts  # buildingType 처리

frontend/
└── src/
    ├── components/
    │   ├── TransactionModal.tsx   # US1, US3, US4 변경
    │   └── RankingList.tsx        # US2 변경
    └── pages/
        └── Dashboard.tsx          # 버튼 텍스트 변경
```

**Structure Decision**: 기존 monorepo 구조 유지. 새 파일 생성 없이 기존 컴포넌트 수정으로 구현.

## Complexity Tracking

Constitution 위반 없음 - 추가 정당화 불필요.
