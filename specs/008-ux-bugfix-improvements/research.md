# Research: UX 버그 수정 및 기능 개선

**Feature**: 008-ux-bugfix-improvements
**Date**: 2026-02-01

## 1. 거래 유형 한글화 매핑

### Decision
기존 TransactionType enum 값을 한글 라벨로 매핑하는 상수 객체 생성

### Rationale
- 기존 백엔드 코드 변경 없이 프론트엔드에서만 표시 변환
- 유지보수 용이 (한 곳에서 관리)
- TypeScript 타입 안전성 보장

### Implementation
```typescript
// frontend/src/utils/transactionLabels.ts
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
```

### Alternatives Considered
- 백엔드에서 한글 라벨 전송: 불필요한 네트워크 오버헤드, 기존 API 변경 필요
- i18n 라이브러리 사용: 단일 언어(한국어)만 지원하므로 과도한 복잡성

---

## 2. 거래내역 상세 정보 표시

### Decision
Transaction 인터페이스의 기존 필드를 활용하여 상세 정보 구성

### Rationale
- 기존 Transaction 인터페이스에 description, reason, soldAsset 필드 존재
- fromId, toId로 송금 대상 식별 가능
- 추가 API 변경 불필요

### Implementation
상세 정보 구성 로직:
```typescript
function getTransactionDetail(tx: Transaction, players: Player[]): string {
  switch (tx.type) {
    case 'TRANSFER':
      const target = players.find(p => p.id === (tx.fromId === myId ? tx.toId : tx.fromId));
      return tx.fromId === myId ? `→ ${target?.nickname}` : `← ${target?.nickname}`;
    case 'BUY_ASSET':
      return tx.description || ''; // 자산 유형 + 토지명
    case 'BANK_RECEIVE':
      return tx.reason || '';
    case 'SELL_ASSET':
      return tx.soldAsset?.assetName || '';
    default:
      return tx.description || '';
  }
}
```

---

## 3. 모던 스크롤바 CSS

### Decision
Tailwind CSS 커스텀 유틸리티 + WebKit/Firefox 스크롤바 스타일링

### Rationale
- 기존 프로젝트에서 Tailwind CSS 사용
- 크로스 브라우저 지원 필요 (Chrome, Firefox, Safari)
- 현재 UI 테마(slate 계열 다크 테마)와 조화

### Implementation
```css
/* frontend/src/index.css */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.5); /* slate-500 with opacity */
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.8);
}

/* Firefox */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
}
```

---

## 4. 은행 수령 개인화

### Decision
BankReceiveModal에서 플레이어 선택 UI 제거, 본인 ID를 toId로 자동 설정

### Rationale
- 사용자 요청: 개개인이 직접 수령
- 기존 tx:bank_receive 이벤트 구조 유지
- 백엔드 권한 체크만 완화 필요

### Current Implementation Analysis
- `BankReceiveModal.tsx`: selectedPlayer state로 대상 선택
- `transaction.handler.ts`: tx:bank_receive 이벤트 처리

### Changes Required
1. Frontend: 플레이어 선택 드롭다운 제거, toId를 현재 사용자 ID로 고정
2. Backend: 호스트 체크 로직 제거 또는 완화

---

## 5. 알림 시스템 복구

### Decision
기존 react-hot-toast 라이브러리 활용, Socket 이벤트 리스너에서 호출

### Rationale
- react-hot-toast 2.6.0 이미 설치됨
- App.tsx에 `<Toaster />` 컴포넌트 이미 존재
- useGame.ts에 일부 toast 호출 존재 (확장 필요)

### Current State
- `App.tsx:25`: `<Toaster position="top-center" reverseOrder={false} />`
- `useGame.ts`: 게임 시작/종료 토스트만 구현

### Implementation
useGame.ts에서 추가 이벤트에 토스트 연동:
- `tx:processed`: 거래 성공 알림
- `notification:received`: 송금 수신, 기타 알림
- 에러 처리: 유효성 검사 실패 시 toast.error()

---

## 6. 자동 포커스 제거

### Decision
TransactionModal의 amount input에서 autoFocus 속성 제거

### Rationale
- 사용자 플로우: 받는 사람/자산 유형 선택 → 금액 입력
- 모바일: 자동 포커스 시 키보드가 바로 올라와 UX 저하

### Current Implementation
- `TransactionModal.tsx:193`: `autoFocus` 속성 존재

### Changes Required
- `autoFocus` 속성 제거
- 필요 시 수동 포커스 트리거 (사용자가 입력 필드 클릭 시)

---

## 7. 토지/건물 매입 UI 개선

### Decision
자산 유형별 조건부 UI 렌더링

### Rationale
- 토지: 새 토지명 입력 (중복 검증)
- 호텔/빌딩/별장: 기존 보유 토지에 건설 → 드롭다운 선택
- 별장: 갯수 선택 추가 (최대 2개)

### Implementation
```typescript
// TransactionModal.tsx 내부 상태 추가
const [landName, setLandName] = useState('');
const [selectedLandId, setSelectedLandId] = useState('');
const [villaCount, setVillaCount] = useState(1);

// 조건부 렌더링
{assetType === 'LAND' && (
  <input placeholder="토지명 입력" value={landName} onChange={...} />
)}
{['HOTEL', 'BUILDING', 'VILLA'].includes(assetType) && (
  <select value={selectedLandId} onChange={...}>
    {myLands.map(land => <option key={land.id} value={land.id}>{land.name}</option>)}
  </select>
)}
{assetType === 'VILLA' && (
  <div className="flex gap-2">
    <button onClick={() => setVillaCount(1)}>1개</button>
    <button onClick={() => setVillaCount(2)}>2개</button>
  </div>
)}
```

### 토지명 중복 검증
```typescript
const isDuplicateLandName = myAssets.some(
  a => a.type === 'LAND' && a.name.toLowerCase() === landName.toLowerCase()
);
```

---

## 8. 자산 매각 표시 양식 개선

### Decision
자산 목록 표시 형식 변경: "토지명" + "자산유형"

### Current Format
```
토지 #1
토지(타입명)
```

### New Format
```
서울
토지

프랑스 빌딩
빌딩

독일 별장1
별장

독일 별장2
별장
```

### Implementation
```typescript
function getAssetDisplayName(asset: Asset): { primary: string; secondary: string } {
  if (asset.type === 'LAND') {
    return { primary: asset.name, secondary: '토지' };
  }
  if (asset.type === 'VILLA') {
    return { primary: `${asset.landName} 별장${asset.villaNumber}`, secondary: '별장' };
  }
  return { primary: `${asset.landName} ${ASSET_TYPE_LABELS[asset.type]}`, secondary: ASSET_TYPE_LABELS[asset.type] };
}
```

---

## 9. 자산 매각 금액 버그 수정

### Decision
만원 단위 표기 → 원 단위 숫자 변환 로직 수정

### Root Cause Analysis
- 금액이 "586만원" 형태로 표시됨
- 매각 처리 시 이 문자열을 파싱하여 숫자로 변환 실패
- `parseInt("586만원")` → NaN 또는 586 (만원 단위 누락)

### Solution
```typescript
// 기존 (버그)
const amount = parseInt(displayAmount.replace(/[^0-9]/g, ''), 10);

// 수정
function parseManwonToWon(displayAmount: string): number {
  // "586만원" → 5860000
  // "5,860,000" → 5860000
  if (displayAmount.includes('만원')) {
    const manwon = parseFloat(displayAmount.replace(/[^0-9.]/g, ''));
    return Math.floor(manwon * 10000);
  }
  return parseInt(displayAmount.replace(/[^0-9]/g, ''), 10);
}
```

---

## 10. 랭킹 자산 조회

### Decision
RankingList에 클릭 이벤트 추가, PlayerAssetModal 신규 컴포넌트 생성

### Rationale
- 기존 RankingList는 읽기 전용
- 모달 패턴은 기존 VotePopup, ConfirmModal과 일관성 유지

### Implementation
```typescript
// RankingList.tsx
const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

<div onClick={() => setSelectedPlayer(player)} className="cursor-pointer">
  {/* 기존 랭킹 아이템 */}
</div>

{selectedPlayer && (
  <PlayerAssetModal
    player={selectedPlayer}
    onClose={() => setSelectedPlayer(null)}
  />
)}
```

---

## 11. 금액 표시 토글

### Decision
MoneyDisplay 컴포넌트에 클릭 이벤트 및 로컬 상태 추가

### Rationale
- 사용자별 선호도 (만원 vs 원 단위)
- 세션 내 상태 유지 (새로고침 시 초기화)

### Implementation
```typescript
// MoneyDisplay.tsx
interface Props {
  amount: number;
  clickable?: boolean; // 토글 가능 여부
}

const [useManwon, setUseManwon] = useState(true);

return (
  <span
    onClick={clickable ? () => setUseManwon(!useManwon) : undefined}
    className={clickable ? 'cursor-pointer' : ''}
  >
    {useManwon ? formatManwon(amount) : formatWon(amount)}
  </span>
);
```

---

## 12. 금액 100조 제한

### Decision
입력 필드에서 실시간 검증 및 제한

### Rationale
- JavaScript Number 안전 범위: 2^53 - 1 ≈ 9 × 10^15
- 100조 = 10^14 → Number 안전 범위 내
- 오버플로우 방지 및 일관된 사용자 경험

### Implementation
```typescript
const MAX_AMOUNT = 100_000_000_000_000; // 100조

function handleAmountChange(value: string) {
  const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  if (numValue > MAX_AMOUNT) {
    toast.error('최대 100조원까지 입력 가능합니다');
    return;
  }
  setAmount(numValue.toLocaleString('ko-KR'));
}

// 붙여넣기 처리
function handlePaste(e: ClipboardEvent) {
  const pastedText = e.clipboardData?.getData('text') || '';
  const numValue = parseInt(pastedText.replace(/[^0-9]/g, ''), 10) || 0;
  if (numValue > MAX_AMOUNT) {
    e.preventDefault();
    toast.error('최대 100조원까지 입력 가능합니다');
  }
}
```

---

## 13. 게임종료 투표 취소

### Decision
기존 투표 시스템 확장하여 취소 기능 추가

### Rationale
- 사용자 실수 방지
- 기존 Vote 인터페이스 확장 (responses에 취소 상태 추가)

### Socket Event Contract
```typescript
// Client → Server
'game_end_vote:cancel': { voteId: string }

// Server → Client
'game_end_vote:updated': Vote // 기존 이벤트 재사용
```

### Backend Changes
```typescript
// vote.service.ts
cancelGameEndVote(roomId: string, playerId: string): Vote | null {
  const vote = this.getActiveVote(roomId);
  if (!vote || vote.responses[playerId] === undefined) return null;

  delete vote.responses[playerId];
  // 또는 vote.responses[playerId] = 'CANCELLED';

  return vote;
}
```

### Frontend Changes
```typescript
// GameEndVotePopup.tsx
<button
  onClick={() => socket.emit('game_end_vote:cancel', { voteId: vote.id })}
  className="bg-slate-700 hover:bg-slate-600 ..."
>
  투표 취소
</button>
```

---

## Summary

모든 NEEDS CLARIFICATION 항목이 해결되었습니다:

| 항목 | 결정 | 근거 |
|------|------|------|
| 거래 유형 한글화 | 프론트엔드 매핑 상수 | 백엔드 변경 불필요, 타입 안전성 |
| 스크롤바 스타일 | CSS 커스텀 유틸리티 | 기존 Tailwind 활용, 크로스 브라우저 |
| 알림 시스템 | react-hot-toast 활용 | 이미 설치됨, Toaster 존재 |
| 토지명 중복 검증 | 프론트엔드 실시간 검증 | 사용자 피드백 즉시 제공 |
| 금액 버그 | 만원→원 변환 함수 수정 | 파싱 로직 명확화 |
| 100조 제한 | 입력 시 실시간 검증 | Number 안전 범위 내 |
| 투표 취소 | 기존 Vote 시스템 확장 | 최소 변경, 일관성 유지 |
