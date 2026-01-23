# Research: 거래 UI 고도화 (Transaction UI Upgrade)

**Status**: Phase 0 Complete

## Decisions

### 1. Data Model: Asset List vs. Asset Value

- **Decision**: Store structured `Asset[]` list in `Player` model.
- **Rationale**: User explicitly requested "Building" independence and clarified storing real asset structures allows for future scalability (rent, trading features).
- **Alternatives Considered**:
  - _Numeric Only `assetValue`_: Rejected. Too simple, doesn't support "My Lands" list or distinguishing types.

### 2. Building vs. Land Relationship

- **Decision**: Independent Assets.
- **Rationale**: User selected Option A (Independent). Simplifies UI flow (no need to select a land before buying a building).
- **Implications**: `Asset.type` will separate 'Land' vs 'Building'. No `parentId` needed.

### 3. Welfare Fund Logic

- **Decision**: Full Amount Only.
- **Rationale**: User Requirement (FR-006). Simplifies "Request" modal logic (no input field, just a button).

## Unknowns Resolved

- All clarifications from `/speckit.clarify` addressed.
