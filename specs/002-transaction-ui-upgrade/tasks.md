# Tasks: 거래 UI 고도화 (Transaction UI Upgrade)

**Feature**: `002-transaction-ui-upgrade`
**Status**: Ready for Implementation

## Phase 1: Setup & Types

- [x] T001 [Setup] Update `shared/src/index.ts` to include `Asset` and `AssetType` interfaces
- [x] T002 [Setup] Update `shared/src/index.ts` Player interface to include `assets: Asset[]` and `assetValue: number`
- [x] T003 [Setup] Update `shared/src/index.ts` TransactionRequest interface to include `assetType?: 'LAND' | 'BUILDING'`

## Phase 2: Foundational (Backend)

- [x] T004 [Foundational] Update `backend/src/models/store.ts` to initialize `assets` array and `assetValue` in Player creation
- [x] T005 [Foundational] Verify `backend/src/handlers/room.handler.ts` correctly instantiates new Player structure

## Phase 3: User Story 1 - Transaction Experience (Auto-close & Subtract)

### Goal: Improve modal UX with auto-close and easier amount input

- [x] T006 [US1] Refactor `frontend/src/hooks/useGame.ts` `requestTransaction` to return a Promise (success/fail) or accept callbacks
- [x] T007 [P] [US1] Update `frontend/src/pages/Dashboard.tsx` to handle `requestTransaction` result and close `modalOpen` state on success
- [x] T008 [P] [US1] Update `frontend/src/components/TransactionModal.tsx` to add "Subtract" buttons (-1만, -5만) in Quick Amounts section
- [x] T009 [US1] Update `frontend/src/components/TransactionModal.tsx` `formatInput` logic to handle subtraction correctly (prevent negative)

## Phase 4: User Story 3 - Asset Management (Land/Building Split)

### Goal: Distinguish Land and Building assets and store them as list

- [x] T010 [US2] Update `backend/src/handlers/transaction.handler.ts` `handleTransaction` for `BUY_ASSET` type
- [x] T011 [US2] Implement logic in frontend/backend to generate default Asset Name (e.g., "Land #1", "Building #1") since input was removed
- [x] T012 [US2] Update `frontend/src/components/TransactionModal.tsx` to allow selecting `assetType` (Land/Building) when `BUY_ASSET` is active
- [x] T013 [US2] Update `frontend/src/pages/Dashboard.tsx` Quick Actions to clearly show "Land" and "Building" options (or open modal with selection)
- [x] T014 [US2] Update `frontend/src/components/RankingList.tsx` or `Dashboard.tsx` asset display to show count of Land/Buildings (optional enhancement for SC-003)

## Phase 5: Welfare Fund Logic (FR-006)

- [x] T015 [Welfare] Update `backend/src/handlers/vote.handler.ts` `handleRequestFund` to ignore incoming amount and use `room.welfareFund` (Full Amount)
- [x] T016 [Welfare] Update `frontend/src/pages/Dashboard.tsx` `handleRequestFund` to remove `prompt` and directly request full amount with confirmation

## Phase 6: Polish & Verification

- [ ] T017 [Polish] Manual Verification: Send 10,000 won -> Check modal closes
- [ ] T018 [Polish] Manual Verification: Buy Land vs Building -> Check Asset List (Backend/Logs)
- [ ] T019 [Polish] Manual Verification: Request Welfare -> Receives Full Amount
- [x] T020 [Polish] Update `walkthrough.md` with screenshots of new UI

## Dependencies

- Phase 1 & 2 blocks Phase 3 & 4.
- Phase 3, 4, 5 are parallelizable.
