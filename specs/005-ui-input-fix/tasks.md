# Tasks: 화면 스크롤 및 입력창 UI 오류 수정

**Input**: Design documents from `/specs/005-ui-input-fix/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: 자동화 테스트는 포함하지 않음 (스펙에서 명시적으로 요청하지 않음). 수동 검증으로 대체.

**Organization**: 3개 User Story (US1: P1, US2: P1, US3: P2)로 구성. 각 스토리는 독립적으로 구현 및 테스트 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` (이 기능은 프론트엔드만 수정)

---

## Phase 1: Setup (N/A)

**Purpose**: 기존 프로젝트 구조 활용 - 별도 설정 불필요

이 기능은 기존 React/Tailwind 프로젝트의 버그 수정이므로 별도의 셋업 작업이 필요하지 않습니다.

---

## Phase 2: Foundational (N/A)

**Purpose**: 공유 인프라 변경 없음

모든 수정은 개별 컴포넌트 레벨에서 이루어지며, 공유 인프라 변경이 필요하지 않습니다.

**Checkpoint**: Foundation ready - user story implementation can begin immediately

---

## Phase 3: User Story 1 - 상단 네비게이션 바 스크롤 겹침 수정 (Priority: P1) 🎯 MVP

**Goal**: 게임 화면(Dashboard)에서 스크롤 시 상단 바가 항상 콘텐츠 위에 표시되도록 수정

**Independent Test**: 게임 화면에서 위아래로 스크롤할 때 상단 바가 항상 콘텐츠 위에 표시되는지 확인

### Implementation for User Story 1

- [x] T001 [US1] Update nav element z-index from `z-10` to `z-[1000]` in frontend/src/pages/Dashboard.tsx:112

**Checkpoint**: User Story 1 완료 - 상단 바가 스크롤 시 콘텐츠 위에 정상 표시됨

---

## Phase 4: User Story 2 - 금액 입력 시 화면 튀는 현상 수정 (Priority: P1)

**Goal**: 금액 입력 필드에 값을 입력할 때 화면 레이아웃이 갑작스럽게 변하지 않도록 수정

**Independent Test**: 금액 입력 필드에 숫자를 입력할 때 화면 위치가 유지되는지 확인

### Implementation for User Story 2

- [x] T002 [US2] Add `min-h-[60px]` class to input container to prevent height changes in frontend/src/components/TransactionModal.tsx:185
- [x] T003 [US2] Add max 10-digit limit to `formatInput` function in frontend/src/components/TransactionModal.tsx:54-58

**Checkpoint**: User Story 2 완료 - 금액 입력 시 화면이 튀지 않음

---

## Phase 5: User Story 3 - 송금 화면 숫자와 '원' 글자 겹침 수정 (Priority: P2)

**Goal**: 금액 입력 필드에서 입력된 숫자와 '원' 글자 사이에 최소 8px 여백 확보

**Independent Test**: 다양한 자릿수의 금액(1자리~10자리)을 입력했을 때 숫자와 '원' 글자가 겹치지 않는지 확인

### Implementation for User Story 3

- [x] T004 [US3] Add `pr-12` (padding-right: 48px) to input field class in frontend/src/components/TransactionModal.tsx:192

**Checkpoint**: User Story 3 완료 - 숫자와 '원' 글자 사이에 충분한 여백 확보됨

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 최종 검증 및 정리

- [ ] T005 Manual verification: 스크롤 테스트 (상단 바 겹침 확인) on Dashboard [USER ACTION REQUIRED]
- [ ] T006 Manual verification: 금액 입력 테스트 (화면 튀는 현상 확인) on TransactionModal [USER ACTION REQUIRED]
- [ ] T007 Manual verification: 10자리 금액 입력 시 숫자/'원' 겹침 확인 on TransactionModal [USER ACTION REQUIRED]
- [ ] T008 Manual verification: 320px 화면 너비에서 UI 배치 확인 [USER ACTION REQUIRED]
- [ ] T009 Run quickstart.md validation - 모든 성공 기준 체크 [USER ACTION REQUIRED]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A - 기존 구조 활용
- **Foundational (Phase 2)**: N/A - 공유 인프라 변경 없음
- **User Stories (Phase 3-5)**: 독립적으로 실행 가능
- **Polish (Phase 6)**: 모든 User Story 완료 후 검증

### User Story Dependencies

- **User Story 1 (P1)**: 독립적 - Dashboard.tsx만 수정
- **User Story 2 (P1)**: 독립적 - TransactionModal.tsx의 formatInput 및 컨테이너 수정
- **User Story 3 (P2)**: 독립적 - TransactionModal.tsx의 input padding 수정

**참고**: US2와 US3는 같은 파일(TransactionModal.tsx)을 수정하지만, 다른 라인/영역을 수정하므로 병렬 실행 가능. 단, 같은 파일을 동시에 수정할 경우 충돌 가능성 있으므로 순차 실행 권장.

### Within Each User Story

- 단일 작업으로 구성되어 의존성 없음
- 각 스토리 완료 후 독립적 검증 가능

### Parallel Opportunities

- T001 (US1)은 Dashboard.tsx 수정
- T002, T003, T004 (US2, US3)는 TransactionModal.tsx 수정
- **병렬 실행**: T001과 T002-T004 그룹은 다른 파일이므로 병렬 실행 가능
- **순차 실행 권장**: T002, T003, T004는 같은 파일이므로 순차 실행 권장

---

## Parallel Example

```bash
# 병렬 실행 가능한 그룹:
# Group 1 (Dashboard.tsx):
Task: T001 [US1] - z-index 수정

# Group 2 (TransactionModal.tsx - 순차 권장):
Task: T002 [US2] - min-h 추가
Task: T003 [US2] - formatInput 10자리 제한
Task: T004 [US3] - pr-12 추가
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 실행: Dashboard.tsx z-index 수정
2. 수동 검증: 스크롤 시 상단 바 겹침 확인
3. **STOP and VALIDATE**: 가장 눈에 띄는 버그 먼저 해결

### Incremental Delivery

1. T001 완료 → US1 검증 → 배포/데모 (MVP!)
2. T002, T003 완료 → US2 검증 → 배포/데모
3. T004 완료 → US3 검증 → 배포/데모
4. T005-T009 완료 → 최종 검증 → 릴리스

### Estimated Effort

- **T001**: ~1분 (단일 클래스명 변경)
- **T002**: ~1분 (단일 클래스 추가)
- **T003**: ~2분 (함수 로직 수정)
- **T004**: ~1분 (단일 클래스 추가)
- **T005-T009**: ~10분 (수동 검증)
- **총 예상 소요**: ~15분

---

## Notes

- 모든 작업은 CSS/Tailwind 클래스 및 간단한 JavaScript 로직 수정
- 새로운 파일 생성 없음
- 백엔드 변경 없음
- 각 User Story는 독립적으로 테스트 가능
- Commit after each user story completion
