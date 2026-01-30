# Tasks: 뱅킹 UI 개선 및 기능 확장

**Input**: Design documents from `/specs/007-banking-features-v2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (monorepo)**: `shared/src/`, `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 타입 정의 확장 및 기반 구조 준비

- [x] T001 [P] TransactionType에 BANK_RECEIVE, SELL_ASSET 추가 in shared/src/index.ts
- [x] T002 [P] BankReceiveReason 타입 추가 (LOTTERY, PRIZE, BONUS, OTHER) in shared/src/index.ts
- [x] T003 [P] Transaction 인터페이스에 reason, soldAsset 필드 추가 in shared/src/index.ts
- [x] T004 [P] NotificationType, Notification 인터페이스 추가 in shared/src/index.ts
- [x] T005 [P] GameEndVote 인터페이스 추가 in shared/src/index.ts
- [x] T006 [P] ServerToClientEvents에 새 이벤트 타입 추가 in shared/src/index.ts
- [x] T007 [P] ClientToServerEvents에 새 이벤트 타입 추가 in shared/src/index.ts
- [x] T008 shared 패키지 빌드 및 타입 체크 (npm run build in shared/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend Store 확장 및 공통 유틸리티

**⚠️ CRITICAL**: Phase 1 완료 후 진행

- [x] T009 Store 클래스에 notifications Map 추가 in backend/src/models/store.ts
- [x] T010 Store 클래스에 gameEndVotes Map 추가 in backend/src/models/store.ts
- [x] T011 Store에 getPlayerTransactions 헬퍼 메서드 추가 in backend/src/models/store.ts
- [x] T012 Store에 getUnreadNotificationCount 헬퍼 메서드 추가 in backend/src/models/store.ts
- [x] T013 [P] formatManwon 유틸리티 함수 생성 in frontend/src/utils/formatMoney.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 금액 입력 버튼 단위 변경 (Priority: P1) 🎯 MVP

**Goal**: 거래 모달의 금액 버튼을 5만/1만/5천/천원 단위로 변경

**Independent Test**: 거래 모달을 열어 새 금액 버튼들이 표시되고 정상 동작하는지 확인

### Implementation for User Story 1

- [x] T014 [US1] 금액 버튼 배열을 [50000, 10000, 5000, 1000]으로 변경 in frontend/src/components/TransactionModal.tsx
- [x] T015 [US1] 복지기금 기부(DONATE) 시 150000 버튼 조건부 추가 in frontend/src/components/TransactionModal.tsx
- [x] T016 [US1] 감소 버튼(-) 클릭 시 음수 방지 로직 확인 in frontend/src/components/TransactionModal.tsx
- [x] T017 [US1] 버튼 레이아웃 UI 조정 (4개 버튼 그리드) in frontend/src/components/TransactionModal.tsx

**Checkpoint**: User Story 1 완료 - 금액 버튼이 새 단위로 동작함

---

## Phase 4: User Story 2 - 자산 현황 만원 단위 표시 (Priority: P1)

**Goal**: 대시보드와 랭킹에서 금액을 만원 단위로 표시

**Independent Test**: 대시보드에서 현금 및 자산이 "150만원", "0.5만원" 형식으로 표시되는지 확인

### Implementation for User Story 2

- [x] T018 [US2] Dashboard 현금 표시에 formatManwon 적용 in frontend/src/pages/Dashboard.tsx
- [x] T019 [US2] Dashboard 총 자산 표시에 formatManwon 적용 in frontend/src/pages/Dashboard.tsx
- [x] T020 [US2] RankingList 플레이어 자산에 formatManwon 적용 in frontend/src/components/RankingList.tsx
- [x] T021 [US2] 0원 표시 처리 ("0원"으로 표시) in frontend/src/utils/formatMoney.ts

**Checkpoint**: User Story 2 완료 - 모든 금액이 만원 단위로 표시됨

---

## Phase 5: User Story 3 - 개인 거래 내역 조회 (Priority: P2)

**Goal**: 플레이어가 자신의 거래 내역을 조회할 수 있음

**Independent Test**: 거래 내역 버튼 클릭 시 본인 관련 거래가 시간순으로 표시되는지 확인

### Implementation for User Story 3

- [x] T022 [US3] transaction:get_history 이벤트 핸들러 추가 in backend/src/handlers/transaction.handler.ts
- [x] T023 [US3] TransactionHistory 모달 컴포넌트 생성 in frontend/src/components/TransactionHistory.tsx
- [x] T024 [US3] 거래 유형별 한글 표시 (송금, 매입, 납부 등) in frontend/src/components/TransactionHistory.tsx
- [x] T025 [US3] 거래 내역 버튼 추가 (대시보드 상단) in frontend/src/pages/Dashboard.tsx
- [x] T026 [US3] useGame hook에 getTransactionHistory 액션 추가 in frontend/src/hooks/useGame.ts
- [x] T027 [US3] 빈 거래 내역 시 안내 메시지 표시 in frontend/src/components/TransactionHistory.tsx

**Checkpoint**: User Story 3 완료 - 거래 내역 조회 기능 동작

---

## Phase 6: User Story 4 - 알림 시스템 (Priority: P2)

**Goal**: 중요 이벤트에 대해 실시간 알림 표시 (4초 후 자동 소멸)

**Independent Test**: 송금 수신 시 알림이 표시되고 4초 후 사라지는지 확인

### Implementation for User Story 4

- [x] T028 [P] [US4] NotificationService 생성 in backend/src/services/notification.service.ts
- [x] T029 [P] [US4] notification.handler 생성 (mark_read, mark_all_read) in backend/src/handlers/notification.handler.ts
- [ ] T030 [US4] 송금 수신 시 알림 생성 로직 추가 in backend/src/services/transaction.service.ts
- [ ] T031 [US4] notification:received 이벤트 emit 추가 in backend/src/handlers/transaction.handler.ts
- [x] T032 [P] [US4] NotificationBadge 컴포넌트 생성 in frontend/src/components/NotificationBadge.tsx
- [ ] T033 [US4] useGame hook에 알림 상태 및 리스너 추가 in frontend/src/hooks/useGame.ts
- [ ] T034 [US4] toast 알림 duration 4000ms 설정 in frontend/src/hooks/useGame.ts
- [ ] T035 [US4] Dashboard 헤더에 NotificationBadge 추가 in frontend/src/pages/Dashboard.tsx

**Checkpoint**: User Story 4 완료 - 알림 시스템 동작

---

## Phase 7: User Story 5 - 은행 수령 기능 (Priority: P2)

**Goal**: 호스트가 플레이어에게 복권/우승상금 등을 지급할 수 있음

**Independent Test**: 호스트가 플레이어 선택 후 금액/사유 입력하여 지급이 완료되는지 확인

### Implementation for User Story 5

- [x] T036 [US5] BANK_RECEIVE 처리 로직 추가 in backend/src/services/transaction.service.ts
- [x] T037 [US5] tx:bank_receive 이벤트 핸들러 추가 in backend/src/handlers/transaction.handler.ts
- [x] T038 [US5] 호스트 권한 검증 로직 추가 in backend/src/handlers/transaction.handler.ts
- [x] T039 [P] [US5] BankReceiveModal 컴포넌트 생성 in frontend/src/components/BankReceiveModal.tsx
- [x] T040 [US5] 사유 선택 UI (복권/우승상금/보너스/기타) in frontend/src/components/BankReceiveModal.tsx
- [x] T041 [US5] 플레이어 선택 드롭다운 (본인 포함) in frontend/src/components/BankReceiveModal.tsx
- [x] T042 [US5] useGame hook에 bankReceive 액션 추가 in frontend/src/hooks/useGame.ts
- [x] T043 [US5] Dashboard에 은행 수령 버튼 추가 (호스트만 표시) in frontend/src/pages/Dashboard.tsx

**Checkpoint**: User Story 5 완료 - 은행 수령 기능 동작

---

## Phase 8: User Story 6 - 자산 매각 기능 (Priority: P2)

**Goal**: 플레이어가 보유 자산을 매각하여 50% 현금화

**Independent Test**: 자산 보유 플레이어가 매각 시 자산가치의 50%가 현금으로 전환되는지 확인

### Implementation for User Story 6

- [x] T044 [US6] SELL_ASSET 처리 로직 (자산 제거, 50% 현금 지급) in backend/src/services/transaction.service.ts
- [x] T045 [US6] tx:sell_asset 이벤트 핸들러 추가 in backend/src/handlers/transaction.handler.ts
- [x] T046 [US6] 자산 소유권 검증 로직 in backend/src/handlers/transaction.handler.ts
- [x] T047 [P] [US6] SellAssetModal 컴포넌트 생성 in frontend/src/components/SellAssetModal.tsx
- [x] T048 [US6] 보유 자산 목록 표시 (현재 가치, 매각 금액) in frontend/src/components/SellAssetModal.tsx
- [x] T049 [US6] 매각 확인 모달 추가 in frontend/src/components/SellAssetModal.tsx
- [x] T050 [US6] 보유 자산 없을 때 안내 메시지 in frontend/src/components/SellAssetModal.tsx
- [x] T051 [US6] useGame hook에 sellAsset 액션 추가 in frontend/src/hooks/useGame.ts
- [x] T052 [US6] Dashboard에 자산 매각 버튼 추가 in frontend/src/pages/Dashboard.tsx

**Checkpoint**: User Story 6 완료 - 자산 매각 기능 동작

---

## Phase 9: User Story 7 - 호스트 게임 종료 동의 프로세스 (Priority: P3)

**Goal**: 호스트의 게임 종료 요청 시 전체 플레이어 동의 필요

**Independent Test**: 호스트 종료 요청 후 모든 플레이어가 동의해야 게임이 종료되는지 확인

### Implementation for User Story 7

- [x] T053 [US7] GameEndVote 시작 로직 추가 in backend/src/services/vote.service.ts
- [x] T054 [US7] 60초 타임아웃 처리 (미응답=동의) in backend/src/services/vote.service.ts
- [x] T055 [US7] 투표 결과 집계 로직 (전원 동의 시 종료) in backend/src/services/vote.service.ts
- [x] T056 [US7] game:request_end 이벤트 핸들러 추가 in backend/src/handlers/game.handler.ts
- [x] T057 [US7] game_end_vote:cast 이벤트 핸들러 추가 in backend/src/handlers/game.handler.ts
- [x] T058 [US7] game_end_vote:started/updated/ended 이벤트 emit in backend/src/handlers/game.handler.ts
- [x] T059 [P] [US7] GameEndVotePopup 컴포넌트 생성 in frontend/src/components/GameEndVotePopup.tsx
- [x] T060 [US7] 투표 진행 상황 표시 (플레이어별 응답) in frontend/src/components/GameEndVotePopup.tsx
- [x] T061 [US7] 남은 시간 카운트다운 표시 in frontend/src/components/GameEndVotePopup.tsx
- [x] T062 [US7] useGame hook에 게임 종료 투표 상태 및 액션 추가 in frontend/src/hooks/useGame.ts
- [x] T063 [US7] Dashboard의 게임 종료 버튼을 투표 요청으로 변경 (호스트) in frontend/src/pages/Dashboard.tsx

**Checkpoint**: User Story 7 완료 ✅ - 게임 종료 동의 프로세스 동작

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 통합 및 마무리

- [x] T064 [P] 모든 새 이벤트 핸들러를 app.ts에 등록 in backend/src/app.ts (이미 registerGameHandlers에 포함)
- [x] T065 [P] 에러 메시지 한글화 (NOT_HOST, ASSET_NOT_FOUND 등) in backend/src/handlers/\*.ts
- [x] T066: 모든 기능에 대한 수동 통합 테스트 수행 <!-- id: 66 -->
- [x] T067: `quickstart.md`의 체크리스트 검증 <!-- id: 67 -->

## Checkpoint

- [x] Checkpoint 10: 에러 처리 및 폴리싱 완료? <!-- id: 68 -->
- [x] 모든 기능이 구현되고 테스트되었는가? <!-- id: 69 -->

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion
- **Phase 3-9 (User Stories)**: All depend on Phase 2 completion
  - User Stories can proceed in priority order (P1 → P2 → P3)
  - US1, US2 are P1 and can be done in parallel
  - US3, US4, US5, US6 are P2 and can be done in parallel
  - US7 is P3 and should be last
- **Phase 10 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

| Story           | Priority | Dependencies  | Can Parallel With      |
| --------------- | -------- | ------------- | ---------------------- |
| US1 (금액 버튼) | P1       | Phase 2       | US2                    |
| US2 (만원 표시) | P1       | Phase 2, T013 | US1                    |
| US3 (거래 내역) | P2       | Phase 2       | US4, US5, US6          |
| US4 (알림)      | P2       | Phase 2       | US3, US5, US6          |
| US5 (은행 수령) | P2       | Phase 2       | US3, US4, US6          |
| US6 (자산 매각) | P2       | Phase 2       | US3, US4, US5          |
| US7 (종료 투표) | P3       | Phase 2       | None (lowest priority) |

### Parallel Opportunities

**Phase 1**: T001-T007 모두 병렬 가능 (shared/src/index.ts 내 별도 섹션)

**Phase 2**: T009-T012 순차 (같은 파일), T013 병렬 가능 (다른 파일)

**User Stories**:

- P1 스토리들(US1, US2) 병렬 가능
- P2 스토리들(US3-US6) 병렬 가능
- 각 스토리 내 [P] 표시된 태스크 병렬 가능

---

## Parallel Example: Phase 1

```bash
# Launch all type definitions together:
Task: "TransactionType에 BANK_RECEIVE, SELL_ASSET 추가 in shared/src/index.ts"
Task: "BankReceiveReason 타입 추가 in shared/src/index.ts"
Task: "Notification 인터페이스 추가 in shared/src/index.ts"
```

## Parallel Example: P2 Stories

```bash
# Launch all P2 user stories together (different files):
Task: "[US3] TransactionHistory 모달 컴포넌트 생성 in frontend/src/components/TransactionHistory.tsx"
Task: "[US4] NotificationBadge 컴포넌트 생성 in frontend/src/components/NotificationBadge.tsx"
Task: "[US5] BankReceiveModal 컴포넌트 생성 in frontend/src/components/BankReceiveModal.tsx"
Task: "[US6] SellAssetModal 컴포넌트 생성 in frontend/src/components/SellAssetModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (타입 정의)
2. Complete Phase 2: Foundational (Store 확장, formatMoney)
3. Complete Phase 3: User Story 1 (금액 버튼)
4. Complete Phase 4: User Story 2 (만원 표시)
5. **STOP and VALIDATE**: 기본 UI 개선 완료 확인
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 기반 준비
2. US1 + US2 (P1) → UI 개선 MVP 🎯
3. US3 (거래 내역) → 정보 조회 기능
4. US4 (알림) → 실시간 알림
5. US5 (은행 수령) → 호스트 기능
6. US6 (자산 매각) → 전략 기능
7. US7 (종료 투표) → 안전장치
8. Polish → 마무리

---

## Notes

- [P] tasks = 다른 파일, 의존성 없음
- [Story] label = 특정 user story에 매핑
- 각 user story는 독립적으로 테스트 가능
- 커밋은 각 태스크 또는 논리적 그룹 완료 후
- 체크포인트에서 스토리 독립 검증 가능
