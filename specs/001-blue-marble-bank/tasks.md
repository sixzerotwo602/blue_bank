---
description: "Task list for Blue Marble Bank implementation"
---

# Tasks: Blue Marble Bank

**Input**: Design documents from `/specs/001-blue-marble-bank/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/socket-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directories (backend, frontend) per structure in plan.md
- [ ] T002 Initialize backend (Node.js/TS) with `package.json` and dependencies
- [ ] T003 Initialize frontend (Vite/React/TS) with `package.json` and dependencies
- [ ] T004 [P] Configure Tailwind CSS in frontend
- [ ] T005 [P] Setup Vitest in backend and frontend
- [ ] T006 [P] Configure ESLint and Prettier for both projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define shared DTOs/Interfaces in `backend/src/models/types.ts`
- [ ] T008 Copy shared types to `frontend/src/types.ts` (or setup shared workspace)
- [ ] T009 Setup Basic Express + Socket.io Server in `backend/src/app.ts`
- [ ] T010 Setup In-Memory Store class in `backend/src/models/store.ts`
- [ ] T011 Create Socket Context/Provider in `frontend/src/services/socketContext.tsx`
- [ ] T012 Create `useSocket` hook in `frontend/src/hooks/useSocket.ts`

**Checkpoint**: Foundation ready - Server runs, Client connects via Socket.io

---

## Phase 3: User Story 1 - Game Entry & Dashboard (Priority: P1) 🎯 MVP

**Goal**: Users can create/join rooms and see their dashboard.

**Independent Test**: Verify 2 clients can join the same room and see each other in the lobby.

### Implementation for User Story 1

- [ ] T013 [US1] Implement `RoomService` (create, join, get) in `backend/src/services/roomService.ts`
- [ ] T014 [US1] Implement `room:create`, `room:join` handlers in `backend/src/handlers/roomHandler.ts`
- [ ] T015 [US1] Implement `game:start` handler in `backend/src/handlers/gameHandler.ts`
- [ ] T016 [P] [US1] Create `Home` page (Nickname input, Create/Join buttons) in `frontend/src/pages/Home.tsx`
- [ ] T017 [P] [US1] Create `Lobby` page (Player list, Ready status) in `frontend/src/pages/Lobby.tsx`
- [ ] T018 [P] [US1] Create `Dashboard` layout (Header, Nav) in `frontend/src/pages/Dashboard.tsx`
- [ ] T019 [US1] Connect Home/Lobby UI to Socket events in `frontend/src/hooks/useGame.ts`

**Checkpoint**: User Story 1 fully functional (Room creation -> joining -> lobby)

---

## Phase 4: User Story 2 - Financial Transactions (Priority: P1)

**Goal**: Users can performing banking operations (Transfer, Buy, Salary).

**Independent Test**: Verify balance updates across clients after transfer/purchase.

### Implementation for User Story 2

- [ ] T020 [US2] Implement `TransactionService` (process transfer, buy, salary) in `backend/src/services/transactionService.ts`
- [ ] T021 [US2] Implement `tx:request` handler in `backend/src/handlers/transactionHandler.ts`
- [ ] T022 [P] [US2] Create `MoneyDisplay` component in `frontend/src/components/MoneyDisplay.tsx`
- [ ] T023 [P] [US2] Create `TransactionModal` (Transfer/Buy forms) in `frontend/src/components/TransactionModal.tsx`
- [ ] T024 [P] [US2] Create `SalaryButton` component in `frontend/src/components/SalaryButton.tsx`
- [ ] T025 [US2] Integrate Transaction Logic in `frontend/src/pages/Dashboard.tsx`

**Checkpoint**: Banking features working.

---

## Phase 5: User Story 3 - Welfare Fund System (Priority: P2)

**Goal**: Donation and Democratic Voting system.

**Independent Test**: Verify donation updates fund; Limit request triggers vote; Voting result applies correctly.

### Implementation for User Story 3

- [ ] T026 [US3] Implement `VoteService` (start vote, cast vote, tally) in `backend/src/services/voteService.ts`
- [ ] T027 [US3] Implement `vote:request_fund`, `vote:cast` handlers in `backend/src/handlers/voteHandler.ts`
- [ ] T028 [P] [US3] Create `WelfareCard` component (Fund balance + Donate/Receive buttons) in `frontend/src/components/WelfareCard.tsx`
- [ ] T029 [P] [US3] Create `VotePopup` component (Approve/Reject) in `frontend/src/components/VotePopup.tsx`
- [ ] T030 [US3] Integrate Voting events in `frontend/src/hooks/useGame.ts`

**Checkpoint**: Welfare system functional.

---

## Phase 6: User Story 4 - Ranking & Status (Priority: P3)

**Goal**: Leaderboard based on total assets.

**Independent Test**: Verify ranking order changes as assets change.

### Implementation for User Story 4

- [ ] T031 [US4] Add `getTotalAsset` helper in `backend/src/models/player.ts` (if needed) or calc on client
- [ ] T032 [P] [US4] Create `RankingList` component in `frontend/src/components/RankingList.tsx`
- [ ] T033 [US4] Add Ranking tab to `frontend/src/pages/Dashboard.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T034 [P] Add error toast notifications (using a library like `react-hot-toast`)
- [ ] T035 [P] Add sound effects for transactions/income (optional)
- [ ] T036 Review and Cleanup `console.log`
- [ ] T037 Perform E2E manual walkthrough (4 players)
- [ ] T038 Create `walkthrough.md` with screenshots

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup & Foundation.
2. Build Room System (US1) to get players connected.
3. Build Transaction System (US2) to allow core gameplay.
4. **Deploy/Test MVP**.

### Incremental Delivery

1. Add US3 (Welfare) - adds fun factor.
2. Add US4 (Ranking) - adds competitive factor.
