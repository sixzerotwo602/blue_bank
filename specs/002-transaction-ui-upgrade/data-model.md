# Data Model: 거래 UI 고도화

**Status**: Phase 1 Design

## Entities

### Player (Update)

Existing entity in `shared/src/index.ts`.

```typescript
export interface Player {
  // ... existing fields ...
  assetValue: number; // Sum of all asset values
  assets: Asset[]; // [NEW] List of owned assets
}
```

### Asset (New)

New entity to track owned properties.

```typescript
export type AssetType = 'LAND' | 'BUILDING';

export interface Asset {
  id: string; // Unique ID (UUID)
  type: AssetType; // Discriminator
  name?: string; // Optional name (removed requirement, but kept in model just in case? No, remove if unused. Or keep as optional if UI supports default names like "Land #1")
  // Spec says: "Input field removed". But we still need to display SOMETHING on the dashboard.
  // Decision: Use generated names "Land 1", "Building 1" or just type name?
  // Spec SC-003: "Display type(Land/Building) correctly".
  value: number; // Purchase Price
  createdAt: number; // Timestamp
}
```

**Clarification Implication**:

- Since user removed "Name Input", backend will auto-generate or just track Type/Value.
- Let's keep `name` optional or unnecessary for MVP if we just list "Land: 500,000".

## Store (Backend)

No schema changes needed if using In-Memory `Player` object. `store.ts` will hold these structures in memory.
