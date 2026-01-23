# Tasks: Game Settlement

**Feature**: `003-game-settlement`
**Spec**: [spec.md](./spec.md)

## Phase 1: Setup

- [x] T001 Define types for `Room.status` (ENDED), `Ranking` and `GameEndedPayload` in `backend/src/models/room.ts`
- [x] T002 Sync shared types to frontend (manually or via shared package update) if applicable (or define in `frontend/src/types` for MVP)

## Phase 2: User Story 1 - Host Ends Game & Settlement Logic (Backend)

- [x] T003 [US1] Implement `game:end` event listener in `backend/src/handlers/game.handler.ts`
- [x] T004 [US1] Implement `endGame` service or method in `backend/src/services/game.service.ts` to calculate rankings (Total = Cash + Asset)
- [x] T005 [US1] Implement broadcasting of `game:ended` event with ranking payload in `backend/src/services/game.service.ts`

## Phase 3: User Story 1 & 2 - Game End Trigger & Settlement UI (Frontend)

- [x] T006 [US1] Add `game:ended` event handler in `frontend/src/hooks/useGame.ts` to store `ranking` state
- [x] T007 [US2] Create `SettlementView` component in `frontend/src/components/SettlementView.tsx` (Use fixed overlay, gold/bold for total assets)
- [x] T008 [US2] Implement "Home" button navigation logic in `SettlementView` (disconnect/leave room + navigate to `/`)
- [x] T009 [US1] Add "Game End" button to `frontend/src/pages/Dashboard.tsx` (Bottom, Red, Host-only check)
- [x] T010 [US1] Integrate `ConfirmModal` for "Game End" button in `Dashboard.tsx`

## Phase 4: Polish

- [x] T011 Verify ranking sorting logic (Descending by Cash + Asset) with manual test
- [x] T012 Ensure responsive design for `SettlementView` (Mobile/Desktop check)

## Implementation Strategy

- **MVP Scope**: All tasks.
- **Order**: Backend logic first -> Frontend Hook -> UI Components -> Integration.

## Dependencies

- US2 (Viewing) depends on US1 (Triggering & Calculation).
