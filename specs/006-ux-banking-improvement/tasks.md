# Tasks: UX 뱅킹 개선

**Input**: Design documents from `/specs/006-ux-banking-improvement/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: 자동화 테스트 미요청. 수동 검증으로 대체.

**Organization**: 4개 User Story (US1: P1, US2: P1, US3: P2, US4: P1)로 구성. US1과 US4는 밀접하게 연관됨.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `shared/src/`, `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (N/A)

**Purpose**: 기존 프로젝트 구조 활용 - 별도 설정 불필요

이 기능은 기존 monorepo 프로젝트의 UI/UX 개선이므로 별도의 셋업 작업이 필요하지 않습니다.

---

## Phase 2: Foundational (Shared Type Extension)

**Purpose**: 모든 User Story에서 사용할 BuildingType 타입 추가

**⚠️ CRITICAL**: US3(건물 유형 구분)는 이 타입에 의존하므로 먼저 완료 필요

- [x] T001 Add BuildingType type literal in shared/src/index.ts
- [x] T002 Add buildingType optional field to Asset interface in shared/src/index.ts
- [x] T003 Add buildingType to ClientToServerEvents tx:request payload in shared/src/index.ts
- [x] T004 Update transaction.handler.ts to store buildingType when creating Asset in backend/src/handlers/transaction.handler.ts

**Checkpoint**: Foundation ready - shared 타입과 백엔드 처리 완료, 프론트엔드 작업 시작 가능

---

## Phase 3: User Story 1 + 4 - 송금 대상 명확화 & 용어 통일 (Priority: P1) 🎯 MVP

**Goal**: 송금하기 모달에서 "플레이어에게 송금" / "은행으로 송금" 버튼을 분리하고, "비용 지불" 용어를 "은행에 납부"로 통일

**Independent Test**: 송금하기 모달에서 2개 확인 버튼이 색상 구분되어 표시되고, 각각 TRANSFER/PAY_COST 트랜잭션 발생 확인

### Implementation for User Story 1 + 4

- [x] T005 [US1] Update TransactionModal to show dual submit buttons for TRANSFER type in frontend/src/components/TransactionModal.tsx
- [x] T006 [US1] Add "플레이어에게 송금" button (blue, requires toId) in frontend/src/components/TransactionModal.tsx
- [x] T007 [US1] Add "은행으로 송금" button (red, PAY_COST type) in frontend/src/components/TransactionModal.tsx
- [x] T008 [US4] Change renderTitle() PAY_COST case from "비용 지불" to "은행에 납부" in frontend/src/components/TransactionModal.tsx
- [x] T009 [P] [US4] Update Dashboard button text from "토지/건물/비용지불" to "토지/건물 매입" in frontend/src/pages/Dashboard.tsx
- [x] T010 [US1] Remove "비용 지불" tab from BUY_ASSET type selector in frontend/src/components/TransactionModal.tsx

**Checkpoint**: User Story 1 + 4 완료 - 송금 대상 구분 및 용어 통일 완료

---

## Phase 4: User Story 3 - 건물 유형 구분 (Priority: P2, 선행 필요)

**Goal**: 토지/건물 매입 모달에서 4버튼 그리드(토지/호텔/빌딩/별장)로 변경하고, buildingType 전달

**Independent Test**: BUY_ASSET 모달에서 4개 버튼 표시, 각 선택 시 올바른 assetType/buildingType 전송 확인

### Implementation for User Story 3 (Part 1: Input UI)

- [x] T011 [US3] Replace 2-button (토지/건물) with 4-button grid (토지/호텔/빌딩/별장) in frontend/src/components/TransactionModal.tsx
- [x] T012 [US3] Add buildingType state to TransactionModal component in frontend/src/components/TransactionModal.tsx
- [x] T013 [US3] Update button click handlers to set correct assetType and buildingType in frontend/src/components/TransactionModal.tsx
- [x] T014 [US3] Update onSubmit call to pass buildingType parameter in frontend/src/components/TransactionModal.tsx
- [x] T015 [US3] Update TransactionModal Props interface to include buildingType in frontend/src/components/TransactionModal.tsx

**Checkpoint**: User Story 3 Part 1 완료 - 건물 유형 입력 UI 구현 완료

---

## Phase 5: User Story 2 - 실시간 뱅킹 자산 정보 개선 (Priority: P1)

**Goal**: 실시간 랭킹에서 토지/건물 개수와 평가액을 함께 표시

**Independent Test**: RankingList에서 자산 있는 플레이어는 "🏞️ 토지: N개 (X만원)" 형식, 없는 플레이어는 "🏞️ 0 | 🏢 0" 형식 확인

### Implementation for User Story 2

- [x] T016 [US2] Create helper function to calculate asset count and value by type in frontend/src/components/RankingList.tsx
- [x] T017 [US2] Update asset display from "🏞️ N" to "🏞️ 토지: N개 (X만원)" format in frontend/src/components/RankingList.tsx
- [x] T018 [US2] Handle zero assets case with compact display "🏞️ 0 | 🏢 0" in frontend/src/components/RankingList.tsx

**Checkpoint**: User Story 2 완료 - 자산 정보 개선 표시 완료

---

## Phase 6: User Story 3 (Part 2) - 건물 유형별 아이콘 표시 (Priority: P2)

**Goal**: 랭킹 목록에서 건물 유형(호텔/빌딩/별장)별로 다른 아이콘 표시

**Independent Test**: 플레이어가 호텔/빌딩/별장을 보유할 때 각각 🏨/🏢/🏡 아이콘으로 구분 표시 확인

### Implementation for User Story 3 (Part 2: Display UI)

- [x] T019 [US3] Create getBuildingIcon helper function (HOTEL→🏨, BUILDING→🏢, VILLA→🏡) in frontend/src/components/RankingList.tsx
- [x] T020 [US3] Update building display to show count per buildingType with icons in frontend/src/components/RankingList.tsx
- [x] T021 [US3] Handle undefined buildingType (legacy data) with default "빌딩" display in frontend/src/components/RankingList.tsx

**Checkpoint**: User Story 3 완료 - 건물 유형 구분 전체 완료

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 최종 검증 및 모바일 반응형 확인

- [ ] T022 Manual verification: 송금 모달 2버튼 색상 구분 확인 [USER ACTION REQUIRED]
- [ ] T023 Manual verification: 4버튼 그리드 (토지/호텔/빌딩/별장) 320px 화면 배치 확인 [USER ACTION REQUIRED]
- [ ] T024 Manual verification: 실시간 랭킹 자산 정보 표시 확인 [USER ACTION REQUIRED]
- [ ] T025 Manual verification: "비용 지불" 텍스트 앱 전체에서 사라짐 확인 [USER ACTION REQUIRED]
- [ ] T026 Run quickstart.md validation - 모든 성공 기준 체크 [USER ACTION REQUIRED]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - 기존 구조 활용
- **Foundational (Phase 2)**: shared 타입 + 백엔드 수정 - US3에 필요
- **User Story 1+4 (Phase 3)**: Foundational 불필요, 독립 실행 가능
- **User Story 3 Part 1 (Phase 4)**: Foundational 필요
- **User Story 2 (Phase 5)**: 독립 실행 가능
- **User Story 3 Part 2 (Phase 6)**: Foundational 필요 (buildingType 타입)
- **Polish (Phase 7)**: 모든 User Story 완료 후 검증

### User Story Dependencies

- **User Story 1+4 (P1)**: TransactionModal 수정 - 다른 스토리와 독립
- **User Story 2 (P1)**: RankingList 수정 - 다른 스토리와 독립
- **User Story 3 (P2)**: Foundational에 의존 (BuildingType 타입), TransactionModal + RankingList 모두 수정

### Within Each User Story

- US1+4: 모달 수정이 연속적이므로 순차 실행 권장
- US2: 단일 파일(RankingList) 수정
- US3: Part 1 (입력 UI) → Part 2 (표시 UI) 순서

### Parallel Opportunities

- T009 [US4]는 Dashboard.tsx 수정으로 다른 작업과 병렬 가능
- Phase 3 (US1+4)와 Phase 5 (US2)는 다른 파일이므로 병렬 실행 가능
- Phase 2 (Foundational)는 Phase 4, 6 (US3)의 선행 조건

---

## Parallel Example

```bash
# 병렬 실행 가능한 그룹:

# Group 1 (TransactionModal.tsx - US1+4):
Task: T005-T008, T010 [US1+4] - 송금 버튼 분리 및 용어 변경

# Group 2 (Dashboard.tsx - US4):
Task: T009 [US4] - 버튼 텍스트 변경 (병렬 가능)

# Group 3 (RankingList.tsx - US2):
Task: T016-T018 [US2] - 자산 정보 표시

# 순차 필요:
Foundational (T001-T004) → US3 Part 1 (T011-T015) → US3 Part 2 (T019-T021)
```

---

## Implementation Strategy

### MVP First (User Story 1+4 Only)

1. T005-T010 실행: 송금 버튼 분리 + 용어 통일
2. 수동 검증: 2버튼 색상 구분, PAY_COST 처리 확인
3. **STOP and VALIDATE**: 가장 핵심적인 UX 개선 완료

### Incremental Delivery

1. T001-T004 완료 → Foundational 준비
2. T005-T010 완료 → US1+4 검증 → 배포/데모 (MVP!)
3. T016-T018 완료 → US2 검증 → 배포/데모
4. T011-T015 완료 → US3 Part 1 검증 → 배포/데모
5. T019-T021 완료 → US3 Part 2 검증 → 배포/데모
6. T022-T026 완료 → 최종 검증 → 릴리스

---

## Notes

- 모든 작업은 기존 파일 수정 (새 파일 생성 없음)
- US1과 US4는 같은 파일(TransactionModal.tsx)을 수정하므로 통합 진행
- US3는 Foundational(타입 추가)에 의존하므로 순서 주의
- Commit after each user story completion
- 320px 최소 화면 너비 지원 확인 필수
