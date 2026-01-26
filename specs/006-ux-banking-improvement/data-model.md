# Data Model: UX 뱅킹 개선

**Feature**: 006-ux-banking-improvement
**Date**: 2026-01-26

## Entity Changes

### 1. BuildingType (NEW)

새로운 타입 리터럴 추가:

```typescript
export type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';
```

### 2. Asset (MODIFIED)

기존 Asset 인터페이스에 buildingType 필드 추가:

```typescript
// Before
export interface Asset {
  id: string;
  type: 'LAND' | 'BUILDING';
  name?: string;
  value: number;
  createdAt: number;
}

// After
export interface Asset {
  id: string;
  type: 'LAND' | 'BUILDING';
  buildingType?: BuildingType;  // NEW: 건물 유형 (type === 'BUILDING'일 때만 사용)
  name?: string;
  value: number;
  createdAt: number;
}
```

**Validation Rules**:
- `buildingType`은 `type === 'BUILDING'`일 때만 유효
- 미지정 시 기본값: `'BUILDING'`
- `type === 'LAND'`일 때 `buildingType` 무시

### 3. ClientToServerEvents (MODIFIED)

tx:request 이벤트의 payload에 buildingType 추가:

```typescript
// Before
'tx:request': (tx: {
  type: TransactionType;
  amount: number;
  toId?: string;
  assetType?: 'LAND' | 'BUILDING';
}, callback?: (response: { success: boolean, txId?: string, error?: string }) => void) => void;

// After
'tx:request': (tx: {
  type: TransactionType;
  amount: number;
  toId?: string;
  assetType?: 'LAND' | 'BUILDING';
  buildingType?: BuildingType;  // NEW: 건물 유형
}, callback?: (response: { success: boolean, txId?: string, error?: string }) => void) => void;
```

## State Transitions

### Asset Creation Flow

```
1. User selects asset type in TransactionModal
   ├─ 토지 선택 → assetType: 'LAND', buildingType: undefined
   ├─ 호텔 선택 → assetType: 'BUILDING', buildingType: 'HOTEL'
   ├─ 빌딩 선택 → assetType: 'BUILDING', buildingType: 'BUILDING'
   └─ 별장 선택 → assetType: 'BUILDING', buildingType: 'VILLA'

2. tx:request sent to backend

3. Backend creates Asset with buildingType

4. room:sync broadcasts updated player.assets
```

### Transfer Flow (Modified)

```
1. User opens 송금하기 modal (TRANSFER type)

2. User enters amount

3. User clicks one of two buttons:
   ├─ "플레이어에게 송금"
   │   └─ Requires toId selection
   │   └─ Sends: { type: 'TRANSFER', amount, toId }
   │
   └─ "은행으로 송금"
       └─ No toId required
       └─ Sends: { type: 'PAY_COST', amount }
```

## Relationships

```
Player (1) ─────── (*) Asset
                    │
                    ├─ type: 'LAND'
                    │   └─ buildingType: null
                    │
                    └─ type: 'BUILDING'
                        └─ buildingType: 'HOTEL' | 'BUILDING' | 'VILLA'
```

## UI Display Mapping

| buildingType | Icon | Label | Color |
|--------------|------|-------|-------|
| (LAND) | 🏞️ | 토지 | emerald |
| HOTEL | 🏨 | 호텔 | amber |
| BUILDING | 🏢 | 빌딩 | blue |
| VILLA | 🏡 | 별장 | green |

## Backward Compatibility

| Scenario | Handling |
|----------|----------|
| 기존 BUILDING 자산 (buildingType 없음) | UI에서 '빌딩'으로 표시 |
| 기존 tx:request (buildingType 없음) | assetType만 사용, buildingType 기본값 적용 |
| 새 클라이언트 + 구 서버 | buildingType 무시됨 |
| 구 클라이언트 + 새 서버 | buildingType undefined로 처리 |
