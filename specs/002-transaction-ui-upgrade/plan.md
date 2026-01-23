# Implementation Plan: 거래 UI 고도화 (Transaction UI Upgrade)

**Branch**: `002-transaction-ui-upgrade` | **Date**: 2026-01-23 | **Spec**: [spec.md](../specs/002-transaction-ui-upgrade/spec.md)
**Input**: Feature specification from `/specs/002-transaction-ui-upgrade/spec.md`

## Summary

This feature upgrades the transaction UI to improve user experience and support expanded game mechanics.
**Primary Requirements**:

1.  **Auto-Close Modals**: All success/alert modals close automatically.
2.  **Amount Subtraction**: Input keypad supports decrementing values (e.g., -10k).
3.  **Asset Renaming & Types**: Change "Asset" to "Land/Building"; Support independent Building purchases.
4.  **Data Model**: Store assets as a structured list (`Asset[]`) on the Player model, not just a numeric sum.
5.  **Welfare Fund**: Forcing full amount withdrawal.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (LTS)
**Primary Dependencies**: React (Frontend), Socket.IO (Real-time), TailwindCSS (Styling)
**Storage**: In-Memory Map (Store class) for MVP
**Testing**: Vitest (Unit), Manual Verification
**Target Platform**: Web Browsers (Mobile-first UI)
**Project Type**: Web Application (React + Node.js)
**Performance Goals**: Instant UI feedback (<100ms) for modal interactions.
**Constraints**: Mobile-responsive design is critical.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **KISS**: UI changes are direct responses to user needs (Auto-close, Subtract). No complex state management introduced unnecessarily.
- **YAGNI**: "Land/Building" split is purely UI/Data classification; no complex inheritance or game logic (rent, combos) implemented yet, just the data structure to support it.
- **DRY**: Reusing `MoneyInput` component (will refactor if needed) for both Transfer and Buy.
- **SRP**: `TransactionService` handles logic; Components handle UI. separation maintained.
- **SOC**: Data model (`Asset`) separated from View (`Dashboard`).

## Project Structure

### Documentation (this feature)

```text
specs/002-transaction-ui-upgrade/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── store.ts       # Update Player/Asset Interface
│   └── handlers/
│       └── transaction.handler.ts # Update Buy logic
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── TransactionModal.tsx # Auto-close, Subtract UI
│   │   └── RankingList.tsx    # Asset display update
│   ├── pages/
│   │   └── Dashboard.tsx      # Entry points for Land/Building
│   └── hooks/
│       └── useGame.ts         # Hook updates if handling new events
```

**Structure Decision**: Standard "Frontend + Backend" Monorepo structure. No new packages.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       |            |                                      |
