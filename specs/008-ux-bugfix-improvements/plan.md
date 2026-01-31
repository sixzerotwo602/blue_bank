# Implementation Plan: UX 버그 수정 및 기능 개선

**Branch**: `008-ux-bugfix-improvements` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-ux-bugfix-improvements/spec.md`

## Summary

기존 블루마블 뱅킹 앱의 UX 버그 수정 및 기능 개선. 거래내역 한글화, 은행 수령 개인화, 알림 시스템 복구, 자동 포커스 제거, 토지/건물 매입 UI 개선, 자산 매각 표시 개선 및 버그 수정, 랭킹 자산 조회, 금액 표시 토글, 100조 제한, 게임종료 투표 취소 버튼 추가.

## Technical Context

**Language/Version**: TypeScript 5.x (Backend: 5.9.3, Frontend: 5.3.3)
**Primary Dependencies**:
- Frontend: React 18.2.0, Tailwind CSS 3.4.1, Vite 5.1.4, Socket.IO Client 4.7.4, react-hot-toast 2.6.0
- Backend: Express 5.2.1, Socket.IO 4.8.3
- Shared: TypeScript types/interfaces
**Storage**: In-memory (Map 기반 Store 클래스)
**Testing**: Vitest 4.0.18
**Target Platform**: Web (Desktop + Mobile 반응형)
**Project Type**: Web application (monorepo: frontend/, backend/, shared/)
**Performance Goals**: 실시간 Socket.IO 통신, 즉각적인 UI 피드백
**Constraints**: 금액 최대 100조 원 (10^14), 별장 최대 2개/토지
**Scale/Scope**: 소규모 멀티플레이어 게임 (2-8명)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity | PASS | 기존 패턴 활용, 새로운 복잡한 아키텍처 불필요 |
| Testability | PASS | 기존 Vitest 테스트 프레임워크 활용 |
| Library-First | N/A | UI 개선 작업으로 새 라이브러리 불필요 |
| Breaking Changes | PASS | 백워드 호환성 유지 (기존 API 확장) |

## Project Structure

### Documentation (this feature)

```text
specs/008-ux-bugfix-improvements/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── socket-events.md # Socket.IO event contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── handlers/
│   │   ├── transaction.handler.ts    # 거래 처리 핸들러
│   │   ├── vote.handler.ts           # 투표 핸들러 (취소 기능 추가)
│   │   └── notification.handler.ts   # 알림 핸들러
│   ├── services/
│   │   ├── transaction.service.ts    # 거래 서비스
│   │   ├── vote.service.ts           # 투표 서비스 (취소 로직)
│   │   └── notification.service.ts   # 알림 서비스
│   └── models/
│       └── store.ts                  # In-memory store
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── TransactionHistory.tsx    # 거래내역 (한글화, 스크롤바)
│   │   ├── TransactionModal.tsx      # 송금/매입 모달 (포커스, 토지명)
│   │   ├── BankReceiveModal.tsx      # 은행 수령 (개인화)
│   │   ├── SellAssetModal.tsx        # 자산 매각 (표시 개선, 버그 수정)
│   │   ├── RankingList.tsx           # 랭킹 (자산 조회 클릭)
│   │   ├── MoneyDisplay.tsx          # 금액 표시 (토글 기능)
│   │   ├── GameEndVotePopup.tsx      # 게임종료 투표 (취소 버튼)
│   │   └── PlayerAssetModal.tsx      # [NEW] 플레이어 자산 현황 모달
│   ├── hooks/
│   │   └── useGame.ts                # 게임 훅 (알림 연동)
│   ├── utils/
│   │   ├── formatMoney.ts            # 금액 포맷팅
│   │   └── transactionLabels.ts      # [NEW] 거래 유형 한글 매핑
│   └── index.css                     # 스크롤바 스타일
└── tests/

shared/
└── src/
    └── index.ts                      # 공유 타입 (Transaction 확장)
```

**Structure Decision**: 기존 monorepo 구조 유지. 신규 컴포넌트는 PlayerAssetModal.tsx 1개, 유틸리티는 transactionLabels.ts 1개만 추가.

## Complexity Tracking

> 위반 사항 없음 - 모든 변경은 기존 패턴 내에서 이루어짐

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |

## Implementation Areas

### Area 1: 거래내역 개선 (FR-001, FR-002, FR-003)
- TransactionHistory.tsx: 한글 라벨 매핑, 상세 내역 표시
- transactionLabels.ts: 거래 유형 → 한글 매핑 상수
- index.css: 모던 스크롤바 CSS

### Area 2: 은행 수령 개인화 (FR-004, FR-005)
- BankReceiveModal.tsx: 플레이어 선택 UI 제거, 본인 계좌 직접 수령
- transaction.handler.ts: 권한 체크 완화 (호스트 → 모든 플레이어)

### Area 3: 알림 시스템 복구 (FR-006, FR-007, FR-008)
- useGame.ts: Socket 이벤트 리스너에서 react-hot-toast 호출
- notification.service.ts: 알림 생성 로직 검증

### Area 4: 자동 포커스 제거 (FR-009, FR-010)
- TransactionModal.tsx: autoFocus 속성 제거
- BankReceiveModal.tsx: autoFocus 속성 제거 (있는 경우)

### Area 5: 토지/건물 매입 UI 개선 (FR-011, FR-011a, FR-012, FR-013)
- TransactionModal.tsx:
  - 토지 선택 시 토지명 입력 필드 추가
  - 호텔/빌딩/별장 선택 시 보유 토지 드롭다운
  - 별장 갯수 선택 버튼 (1개, 2개)
  - 토지명 중복 검증

### Area 6: 자산 매각 개선 (FR-014, FR-015, FR-016)
- SellAssetModal.tsx:
  - 표시 양식 변경: "토지명" + "자산유형"
  - 별장 번호 표시 (별장1, 별장2)
  - 금액 파싱 버그 수정 (만원 → 원 변환)

### Area 7: 랭킹 자산 조회 (FR-017, FR-018)
- RankingList.tsx: 플레이어 클릭 이벤트 추가
- PlayerAssetModal.tsx: [NEW] 자산 현황 모달

### Area 8: 금액 표시 토글 (FR-019)
- MoneyDisplay.tsx: 클릭 시 만원↔숫자 토글 상태 관리

### Area 9: 금액 100조 제한 (FR-020, FR-021)
- TransactionModal.tsx, BankReceiveModal.tsx, SellAssetModal.tsx:
  - 입력 값 검증 (max: 100,000,000,000,000)
  - 붙여넣기 시에도 제한 적용

### Area 10: 게임종료 투표 취소 (FR-022, FR-023)
- GameEndVotePopup.tsx: 취소 버튼 UI 추가
- vote.handler.ts: 투표 취소 이벤트 핸들러
- vote.service.ts: 투표 취소 로직
- shared/index.ts: 취소 이벤트 타입 추가
