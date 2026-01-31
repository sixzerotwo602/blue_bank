# Tasks: UX 버그 수정 및 기능 개선

**Input**: Design documents from `/specs/008-ux-bugfix-improvements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT included (not explicitly requested in specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `shared/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 공통 유틸리티 및 상수 파일 생성

- [x] T001 [P] Create transaction labels mapping in frontend/src/utils/transactionLabels.ts
- [x] T002 [P] Add MAX_AMOUNT constant (100조) in frontend/src/utils/constants.ts
- [x] T003 [P] Add modern scrollbar CSS utility in frontend/src/index.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 여러 스토리에서 공유하는 핵심 기능

**⚠️ CRITICAL**: 이 단계 완료 후 User Story 작업 가능

- [x] T004 Add game_end_vote:cancel event type in shared/src/index.ts
- [x] T005 Add parseManwonToWon utility function in frontend/src/utils/formatMoney.ts
- [x] T006 Add getAssetDisplayInfo helper function in frontend/src/utils/transactionLabels.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 거래내역 한글화 및 상세 기록 (Priority: P1) 🎯 MVP

**Goal**: 거래 유형을 한글로 표시하고 상세 내역 추가

**Independent Test**: 거래 발생 후 거래내역 화면에서 한글 표기와 상세 정보 확인

### Implementation for User Story 1

- [x] T007 [US1] Import TRANSACTION_LABELS from transactionLabels.ts in frontend/src/components/TransactionHistory.tsx
- [x] T008 [US1] Replace English transaction type with Korean label in frontend/src/components/TransactionHistory.tsx
- [x] T009 [US1] Add getTransactionDetail function for detailed info display in frontend/src/components/TransactionHistory.tsx
- [x] T010 [US1] Update transaction item rendering to show detail info in frontend/src/components/TransactionHistory.tsx

**Checkpoint**: US1 완료 - 거래내역에 한글 및 상세 정보 표시됨

---

## Phase 4: User Story 2 - 거래내역 스크롤바 모던 디자인 (Priority: P1)

**Goal**: 스크롤바를 현재 UI 테마와 조화롭게 모던하게 디자인

**Independent Test**: 거래내역 10건 이상일 때 스크롤바 디자인 확인

### Implementation for User Story 2

- [x] T011 [US2] Apply custom-scrollbar class to transaction list container in frontend/src/components/TransactionHistory.tsx

**Checkpoint**: US2 완료 - 모던 스크롤바 적용됨

---

## Phase 5: User Story 3 - 은행 수령 개인화 (Priority: P1)

**Goal**: 모든 플레이어가 직접 은행 수령 가능, 플레이어 선택 UI 제거

**Independent Test**: 일반 플레이어 계정으로 은행 수령 기능 사용 확인

### Implementation for User Story 3

- [x] T012 [P] [US3] Remove player selection dropdown from frontend/src/components/BankReceiveModal.tsx
- [x] T013 [P] [US3] Update socket emit to use current player ID as toId in frontend/src/components/BankReceiveModal.tsx
- [x] T014 [US3] Remove host-only restriction in backend/src/services/transaction.service.ts for bank_receive event

**Checkpoint**: US3 완료 - 모든 플레이어가 직접 은행 수령 가능

---

## Phase 6: User Story 4 - 알림 시스템 동작 복구 (Priority: P1)

**Goal**: 거래 성공/실패 시 적절한 토스트 알림 표시

**Independent Test**: 각 거래 유형 수행 후 해당 알림 표시 확인

### Implementation for User Story 4

- [x] T015 [US4] Add toast import from react-hot-toast in frontend/src/hooks/useGame.ts (already existed)
- [x] T016 [US4] Add toast.success on tx:processed event handler in frontend/src/hooks/useGame.ts (already existed in callback)
- [x] T017 [US4] Add toast for notification:received event (송금 수신 등) in frontend/src/hooks/useGame.ts
- [x] T018 [US4] Add toast.error for validation failures in transaction modals (already existed)

**Checkpoint**: US4 완료 - 거래 관련 알림 정상 동작

---

## Phase 7: User Story 5 - 송금하기 자동 포커스 제거 (Priority: P2)

**Goal**: 송금하기 모달에서 금액 입력 칸 자동 포커스 제거

**Independent Test**: 송금하기 모달 열림 시 금액 입력 칸 포커스 상태 확인

### Implementation for User Story 5

- [x] T019 [US5] Remove autoFocus attribute from TRANSFER mode amount input in frontend/src/components/TransactionModal.tsx

**Checkpoint**: US5 완료 - 송금 모달 자동 포커스 제거됨

---

## Phase 8: User Story 6 - 토지/건물 매입 자동 포커스 제거 (Priority: P2)

**Goal**: 토지/건물 매입 모달에서 금액 입력 칸 자동 포커스 제거

**Independent Test**: 토지/건물 매입 모달 열림 시 금액 입력 칸 포커스 상태 확인

### Implementation for User Story 6

- [x] T020 [US6] Remove autoFocus attribute from BUY_ASSET mode amount input in frontend/src/components/TransactionModal.tsx

**Checkpoint**: US6 완료 - 매입 모달 자동 포커스 제거됨

---

## Phase 9: User Story 7 - 토지/건물 매입 자산 정보 입력 개선 (Priority: P1)

**Goal**: 토지명 입력, 보유 토지 드롭다운, 별장 갯수 선택 UI 추가

**Independent Test**: 각 자산 유형별 매입 플로우 테스트

### Implementation for User Story 7

- [x] T021 [US7] Add landName state and validation in frontend/src/components/TransactionModal.tsx
- [x] T022 [US7] Add selectedLandId state for building purchase in frontend/src/components/TransactionModal.tsx
- [x] T023 [US7] Add villaCount state (1 or 2) for villa purchase in frontend/src/components/TransactionModal.tsx
- [x] T024 [US7] Render land name input field when LAND type selected in frontend/src/components/TransactionModal.tsx
- [x] T025 [US7] Render owned lands dropdown when HOTEL/BUILDING/VILLA selected in frontend/src/components/TransactionModal.tsx
- [x] T026 [US7] Render villa count buttons (1개, 2개) when VILLA selected in frontend/src/components/TransactionModal.tsx
- [x] T027 [US7] Add duplicate land name validation with error toast in frontend/src/components/TransactionModal.tsx
- [x] T028 [US7] Update transaction payload to include landName/selectedLandId/villaCount in frontend/src/components/TransactionModal.tsx

**Checkpoint**: US7 완료 - 자산 매입 UI 개선됨

---

## Phase 10: User Story 8 - 자산 매각 표시 양식 개선 (Priority: P1)

**Goal**: 자산 목록을 "토지명 + 자산유형" 형태로 표시

**Independent Test**: 자산 매각 화면에서 보유 자산 표시 형식 확인

### Implementation for User Story 8

- [x] T029 [US8] Import getAssetDisplayInfo from transactionLabels.ts in frontend/src/components/SellAssetModal.tsx
- [x] T030 [US8] Update asset list rendering to use getAssetDisplayInfo format in frontend/src/components/SellAssetModal.tsx
- [x] T031 [US8] Update villa display to show "토지명 별장N" format in frontend/src/components/SellAssetModal.tsx

**Checkpoint**: US8 완료 - 자산 매각 표시 양식 개선됨

---

## Phase 11: User Story 9 - 자산 매각 금액 인식 버그 수정 (Priority: P1)

**Goal**: 만원 단위 표기를 올바른 숫자 값으로 변환하여 매각 처리

**Independent Test**: 자산 선택 후 매각하기 버튼 클릭 시 정상 처리 확인

### Implementation for User Story 9

- [x] T032 [US9] Import parseManwonToWon from formatMoney.ts in frontend/src/components/SellAssetModal.tsx (N/A - assetId 기반 매각)
- [x] T033 [US9] Fix amount parsing in sell asset handler using parseManwonToWon in frontend/src/components/SellAssetModal.tsx (N/A - backend handles)

**Checkpoint**: US9 완료 - 자산 매각 금액 버그 수정됨

---

## Phase 12: User Story 10 - 실시간 랭킹 자산 현황 조회 (Priority: P2)

**Goal**: 랭킹에서 플레이어 클릭 시 자산 현황 모달 표시

**Independent Test**: 랭킹에서 플레이어 클릭 시 자산 현황 모달/패널 표시 확인

### Implementation for User Story 10

- [x] T034 [P] [US10] Create PlayerAssetModal component in frontend/src/components/PlayerAssetModal.tsx
- [x] T035 [US10] Add selectedPlayer state in frontend/src/components/RankingList.tsx
- [x] T036 [US10] Add onClick handler to player items in frontend/src/components/RankingList.tsx
- [x] T037 [US10] Render PlayerAssetModal when selectedPlayer is set in frontend/src/components/RankingList.tsx

**Checkpoint**: US10 완료 - 랭킹 자산 조회 기능 추가됨

---

## Phase 13: User Story 11 - 현금 자산 표시 형식 토글 (Priority: P2)

**Goal**: 상단 현금 자산 클릭 시 만원↔숫자 단위 토글

**Independent Test**: 현금 자산 클릭 시 표시 형식 변경 확인

### Implementation for User Story 11

- [x] T038 [US11] Add useManwon state to MoneyDisplay in frontend/src/components/MoneyDisplay.tsx
- [x] T039 [US11] Add clickable prop and onClick toggle handler in frontend/src/components/MoneyDisplay.tsx
- [x] T040 [US11] Update Dashboard to pass clickable prop to header MoneyDisplay in frontend/src/pages/Dashboard.tsx

**Checkpoint**: US11 완료 - 금액 표시 토글 기능 추가됨

---

## Phase 14: User Story 12 - 금액 입력 100조 제한 (Priority: P2)

**Goal**: 모든 금액 입력 필드에서 100조 원 초과 입력 차단

**Independent Test**: 100조 초과 금액 입력 시도 시 제한 동작 확인

### Implementation for User Story 12

- [x] T041 [US12] Import MAX_AMOUNT constant in frontend/src/components/TransactionModal.tsx
- [x] T042 [US12] Add amount validation with MAX_AMOUNT check in frontend/src/components/TransactionModal.tsx
- [x] T043 [US12] Add onPaste handler to prevent large amount paste in frontend/src/components/TransactionModal.tsx (handled in formatInput)
- [x] T044 [P] [US12] Add MAX_AMOUNT validation in frontend/src/components/BankReceiveModal.tsx
- [x] T045 [P] [US12] Add MAX_AMOUNT validation in frontend/src/components/SellAssetModal.tsx (N/A - asset value based)

**Checkpoint**: US12 완료 - 100조 제한 적용됨

---

## Phase 15: User Story 13 - 게임종료 투표 취소 버튼 (Priority: P2)

**Goal**: 게임종료 투표 모달에 취소 버튼 추가

**Independent Test**: 게임종료 투표 모달에서 취소 버튼 동작 확인

### Implementation for User Story 13

- [x] T046 [P] [US13] Add cancelGameEndVote method in backend/src/services/vote.service.ts
- [x] T047 [P] [US13] Add game_end_vote:cancel handler in backend/src/handlers/game.handler.ts
- [x] T048 [US13] Add cancel button UI in frontend/src/components/GameEndVotePopup.tsx
- [x] T049 [US13] Add socket emit for game_end_vote:cancel on cancel button click in frontend/src/hooks/useGame.ts
- [x] T050 [US13] Update vote popup to show cancel button only when user is requester in frontend/src/components/GameEndVotePopup.tsx

**Checkpoint**: US13 완료 - 게임종료 투표 취소 기능 추가됨

---

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: 최종 점검 및 통합 테스트

- [x] T051 Run manual testing for all 13 user stories per quickstart.md checklist
- [x] T052 Verify mobile responsiveness for all modified modals
- [x] T053 Code cleanup and remove unused imports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-15)**: All depend on Foundational phase completion
  - P1 stories (US1-4, US7-9) can proceed first
  - P2 stories (US5-6, US10-13) follow
- **Polish (Phase 16)**: Depends on all user stories being complete

### User Story Dependencies

| User Story | Priority | Dependencies | Can Parallel With |
|------------|----------|--------------|-------------------|
| US1 (거래내역 한글화) | P1 | T001 (transactionLabels.ts) | US2, US3, US4 |
| US2 (스크롤바) | P1 | T003 (CSS) | US1, US3, US4 |
| US3 (은행 수령) | P1 | None | US1, US2, US4 |
| US4 (알림 시스템) | P1 | None | US1, US2, US3 |
| US5 (송금 포커스) | P2 | None | US6 |
| US6 (매입 포커스) | P2 | None | US5 |
| US7 (매입 UI) | P1 | None | US8, US9 |
| US8 (매각 표시) | P1 | T006 (getAssetDisplayInfo) | US7, US9 |
| US9 (매각 버그) | P1 | T005 (parseManwonToWon) | US7, US8 |
| US10 (랭킹 자산) | P2 | T006 (getAssetDisplayInfo) | US11, US12, US13 |
| US11 (금액 토글) | P2 | None | US10, US12, US13 |
| US12 (100조 제한) | P2 | T002 (MAX_AMOUNT) | US10, US11, US13 |
| US13 (투표 취소) | P2 | T004 (event type) | US10, US11, US12 |

### Parallel Opportunities

All P1 stories (US1, US2, US3, US4, US7, US8, US9) can be worked on in parallel after Foundational phase.
All P2 stories (US5, US6, US10, US11, US12, US13) can be worked on in parallel.

---

## Parallel Example: P1 Stories

```bash
# After Foundational phase, launch all P1 stories in parallel:
Task: "US1 - Import TRANSACTION_LABELS in TransactionHistory.tsx"
Task: "US2 - Apply custom-scrollbar class in TransactionHistory.tsx"
Task: "US3 - Remove player selection in BankReceiveModal.tsx"
Task: "US4 - Add toast import in useGame.ts"
Task: "US7 - Add landName state in TransactionModal.tsx"
Task: "US8 - Import getAssetDisplayInfo in SellAssetModal.tsx"
Task: "US9 - Import parseManwonToWon in SellAssetModal.tsx"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3-11: All P1 User Stories (T007-T033)
4. **STOP and VALIDATE**: Test all P1 features
5. Deploy/demo if ready

### Full Implementation

1. Complete Setup + Foundational
2. Complete all P1 stories → Test → Deploy
3. Complete all P2 stories → Test → Deploy
4. Complete Polish phase

### Task Count Summary

| Phase | Task Count |
|-------|------------|
| Setup | 3 |
| Foundational | 3 |
| US1 (P1) | 4 |
| US2 (P1) | 1 |
| US3 (P1) | 3 |
| US4 (P1) | 4 |
| US5 (P2) | 1 |
| US6 (P2) | 1 |
| US7 (P1) | 8 |
| US8 (P1) | 3 |
| US9 (P1) | 2 |
| US10 (P2) | 4 |
| US11 (P2) | 3 |
| US12 (P2) | 5 |
| US13 (P2) | 5 |
| Polish | 3 |
| **Total** | **53** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1+US2 both modify TransactionHistory.tsx - coordinate changes
- US7-9 involve related modal components - test together
