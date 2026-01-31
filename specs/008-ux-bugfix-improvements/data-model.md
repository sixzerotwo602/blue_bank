# Data Model: UX 버그 수정 및 기능 개선

**Feature**: 008-ux-bugfix-improvements
**Date**: 2026-02-01

## 기존 엔티티 (변경 없음)

### TransactionType (shared/src/index.ts)
```typescript
export type TransactionType =
  | 'TRANSFER'        // 플레이어 간 송금
  | 'BUY_ASSET'       // 부동산 매입
  | 'PAY_COST'        // 은행에 납부
  | 'DONATE'          // 복지기금 기부
  | 'SALARY'          // 월급 수령
  | 'WELFARE_RECEIVE' // 복지기금 수령
  | 'BANK_RECEIVE'    // 은행 수령
  | 'SELL_ASSET';     // 자산 매각
```

### Transaction (shared/src/index.ts)
```typescript
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  timestamp: number;
  description?: string;
  reason?: BankReceiveReason | string;
  soldAsset?: {
    assetId: string;
    assetName: string;
    originalValue: number;
  };
}
```

### Asset (shared/src/index.ts)
```typescript
export interface Asset {
  id: string;
  type: 'LAND' | 'HOTEL' | 'BUILDING' | 'VILLA';
  name: string;           // 토지명 (토지인 경우) 또는 건물명
  value: number;          // 매입가
  landId?: string;        // 건물인 경우 소속 토지 ID
  landName?: string;      // 건물인 경우 소속 토지명
  villaNumber?: number;   // 별장인 경우 번호 (1 또는 2)
}
```

### Vote (shared/src/index.ts)
```typescript
export interface Vote {
  id: string;
  type: 'WELFARE_FUND' | 'GAME_END';
  requesterId: string;
  targetPlayerId?: string;
  amount?: number;
  responses: Record<string, 'APPROVE' | 'REJECT'>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  expiresAt: number;
}
```

## 신규/확장 타입

### 거래 유형 한글 매핑 (frontend/src/utils/transactionLabels.ts)
```typescript
import { TransactionType } from 'shared';

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  TRANSFER: '송금',
  BUY_ASSET: '자산 매입',
  PAY_COST: '은행 납부',
  DONATE: '복지기금 기부',
  SALARY: '급여',
  WELFARE_RECEIVE: '복지기금 수령',
  BANK_RECEIVE: '은행 수령',
  SELL_ASSET: '자산 매각',
};

export const TRANSACTION_ICONS: Record<TransactionType, string> = {
  TRANSFER: '💸',
  BUY_ASSET: '🏠',
  PAY_COST: '🏦',
  DONATE: '🤝',
  SALARY: '💵',
  WELFARE_RECEIVE: '🎁',
  BANK_RECEIVE: '🎰',
  SELL_ASSET: '📤',
};

export const ASSET_TYPE_LABELS: Record<Asset['type'], string> = {
  LAND: '토지',
  HOTEL: '호텔',
  BUILDING: '빌딩',
  VILLA: '별장',
};

export const ASSET_TYPE_ICONS: Record<Asset['type'], string> = {
  LAND: '🏞️',
  HOTEL: '🏨',
  BUILDING: '🏢',
  VILLA: '🏡',
};
```

### 금액 제한 상수 (frontend/src/utils/constants.ts)
```typescript
export const MAX_AMOUNT = 100_000_000_000_000; // 100조 원
export const MIN_AMOUNT = 1; // 최소 1원
```

### 자산 표시 정보 타입 (frontend only)
```typescript
export interface AssetDisplayInfo {
  primary: string;    // 주 표시명 (예: "서울", "프랑스 빌딩", "독일 별장1")
  secondary: string;  // 자산 유형 (예: "토지", "빌딩", "별장")
  icon: string;       // 이모지 아이콘
}
```

### 플레이어 자산 현황 (frontend only)
```typescript
export interface PlayerAssetSummary {
  playerId: string;
  playerName: string;
  cash: number;
  lands: Asset[];
  buildings: Asset[];  // 호텔 + 빌딩 + 별장
  totalAssetValue: number;
}
```

## Socket.IO 이벤트 타입 확장 (shared/src/index.ts)

### 게임종료 투표 취소 이벤트
```typescript
// ClientToServerEvents 확장
export interface ClientToServerEvents {
  // ... 기존 이벤트들 ...

  /** 게임종료 투표 취소 */
  'game_end_vote:cancel': (data: { voteId: string }) => void;
}

// ServerToClientEvents는 기존 'game_end_vote:updated' 재사용
```

## 상태 전이

### Vote 상태 전이 (게임종료 투표)
```
[PENDING] ──투표──> [PENDING] (responses 업데이트)
    │                   │
    │                   ├──취소──> [PENDING] (response 제거)
    │                   │
    ├──과반수 찬성──> [APPROVED] ──> 게임 종료
    │
    └──과반수 반대 또는 시간 초과──> [REJECTED]
```

### Asset 생성 플로우 (토지/건물 매입)
```
사용자 입력
    │
    ├── 토지 선택 ──> 토지명 입력 ──> 중복 검증 ──> Asset 생성 (type: LAND)
    │
    ├── 호텔 선택 ──> 보유 토지 선택 ──> Asset 생성 (type: HOTEL, landId 연결)
    │
    ├── 빌딩 선택 ──> 보유 토지 선택 ──> Asset 생성 (type: BUILDING, landId 연결)
    │
    └── 별장 선택 ──> 보유 토지 선택 ──> 갯수 선택 (1~2) ──> Asset 생성 (type: VILLA, villaNumber)
```

## 유효성 규칙

### 금액 입력
| 규칙 | 값 | 에러 메시지 |
|------|-----|------------|
| 최소값 | 1원 | "금액은 0보다 커야 합니다" |
| 최대값 | 100,000,000,000,000원 (100조) | "최대 100조원까지 입력 가능합니다" |
| 형식 | 숫자만 | - |

### 토지명 입력
| 규칙 | 설명 | 에러 메시지 |
|------|------|------------|
| 필수 | 빈 값 불가 | "토지명을 입력해주세요" |
| 중복 불가 | 동일 플레이어 내 | "이미 보유한 토지명입니다" |
| 최대 길이 | 20자 | "토지명은 20자 이내로 입력해주세요" |

### 별장 갯수
| 규칙 | 값 | 에러 메시지 |
|------|-----|------------|
| 최소 | 1개 | - |
| 최대 | 2개 | "별장은 토지당 최대 2개까지 건설 가능합니다" |
| 기존 별장 체크 | 해당 토지에 이미 2개 있으면 불가 | "해당 토지에는 더 이상 별장을 건설할 수 없습니다" |

## 데이터 변환 함수

### 금액 변환
```typescript
// 표시용 (원 → 만원)
formatManwon(5860000) // "586만원"
formatWon(5860000)    // "5,860,000원"

// 입력 파싱 (만원 문자열 → 원)
parseManwonToWon("586만원")     // 5860000
parseManwonToWon("5,860,000")   // 5860000
```

### 자산 표시 변환
```typescript
getAssetDisplayInfo(asset: Asset): AssetDisplayInfo

// 예시:
// { type: 'LAND', name: '서울' } → { primary: '서울', secondary: '토지', icon: '🏞️' }
// { type: 'BUILDING', landName: '프랑스' } → { primary: '프랑스 빌딩', secondary: '빌딩', icon: '🏢' }
// { type: 'VILLA', landName: '독일', villaNumber: 1 } → { primary: '독일 별장1', secondary: '별장', icon: '🏡' }
```
