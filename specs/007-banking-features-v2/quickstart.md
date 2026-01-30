# Quickstart Guide: 뱅킹 UI 개선 및 기능 확장

**Date**: 2026-01-30
**Feature**: 007-banking-features-v2

## 1. 개발 환경 설정

### 1.1 의존성 설치

```bash
# 프로젝트 루트에서
npm install
```

### 1.2 개발 서버 실행

```bash
# 터미널 1: Backend
cd backend
npm run dev

# 터미널 2: Frontend
cd frontend
npm run dev
```

### 1.3 테스트 실행

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test
```

## 2. 구현 순서 권장

### Phase 1: 기반 작업 (shared 패키지)

1. **shared/src/index.ts 타입 확장**
   - `TransactionType`에 `BANK_RECEIVE`, `SELL_ASSET` 추가
   - `BankReceiveReason` 타입 추가
   - `Notification` 인터페이스 추가
   - `GameEndVote` 인터페이스 추가
   - Socket.io 이벤트 타입 확장

2. **shared 빌드**
   ```bash
   cd shared
   npm run build
   ```

### Phase 2: Backend 구현

1. **Store 확장** (`backend/src/models/store.ts`)
   - `notifications` Map 추가
   - `gameEndVotes` Map 추가
   - 헬퍼 메서드 추가

2. **Transaction Service 확장** (`backend/src/services/transaction.service.ts`)
   - `BANK_RECEIVE` 처리 로직
   - `SELL_ASSET` 처리 로직

3. **Notification Service 생성** (`backend/src/services/notification.service.ts`)
   - 알림 생성/조회/읽음 처리

4. **Vote Service 확장** (`backend/src/services/vote.service.ts`)
   - 게임 종료 투표 로직 추가

5. **핸들러 구현**
   - `transaction.handler.ts` 확장
   - `notification.handler.ts` 생성
   - `game.handler.ts` 확장

### Phase 3: Frontend 구현

1. **유틸리티 함수** (`frontend/src/utils/formatMoney.ts`)
   - 만원 단위 포맷 함수

2. **금액 버튼 수정** (`frontend/src/components/TransactionModal.tsx`)
   - 버튼 배열 변경: `[50000, 10000, 5000, 1000]`
   - 복지기금 기부 시 15만원 버튼 유지

3. **금액 표시 적용**
   - `Dashboard.tsx`: 현금/총자산 표시
   - `RankingList.tsx`: 플레이어 자산 표시

4. **새 컴포넌트 생성**
   - `TransactionHistory.tsx`: 거래 내역 모달
   - `BankReceiveModal.tsx`: 은행 수령 모달 (호스트용)
   - `SellAssetModal.tsx`: 자산 매각 모달
   - `NotificationBadge.tsx`: 알림 개수 배지
   - `GameEndVotePopup.tsx`: 게임 종료 투표 팝업

5. **useGame Hook 확장** (`frontend/src/hooks/useGame.ts`)
   - 새 이벤트 리스너
   - 새 액션 메서드

6. **Dashboard 통합** (`frontend/src/pages/Dashboard.tsx`)
   - 거래내역 버튼 추가
   - 알림 배지 추가
   - 새 모달들 연결

## 3. 주요 코드 예시

### 3.1 만원 단위 포맷 함수

```typescript
// frontend/src/utils/formatMoney.ts
export function formatManwon(amount: number): string {
  if (amount === 0) return '0원';

  const manwon = amount / 10000;

  if (Number.isInteger(manwon)) {
    return `${manwon.toLocaleString()}만원`;
  } else {
    // 소수점 2자리까지 (0.35만원)
    return `${manwon.toFixed(2).replace(/\.?0+$/, '')}만원`;
  }
}

// 사용 예시
formatManwon(1500000);  // "150만원"
formatManwon(5000);     // "0.5만원"
formatManwon(3500);     // "0.35만원"
formatManwon(0);        // "0원"
```

### 3.2 금액 버튼 수정

```typescript
// frontend/src/components/TransactionModal.tsx
const getAmountButtons = (transactionType: string) => {
  const baseButtons = [50000, 10000, 5000, 1000];

  if (transactionType === 'DONATE') {
    // 복지기금 기부: 15만원 버튼 추가
    return [150000, ...baseButtons];
  }

  return baseButtons;
};
```

### 3.3 자산 매각 처리

```typescript
// backend/src/services/transaction.service.ts
processSellAsset(roomId: string, playerId: string, assetId: string) {
  const room = store.getRoom(roomId);
  const player = room.players.find(p => p.id === playerId);
  const assetIndex = player.assets.findIndex(a => a.id === assetId);

  if (assetIndex === -1) {
    throw new Error('ASSET_NOT_FOUND');
  }

  const asset = player.assets[assetIndex];
  const receivedAmount = Math.floor(asset.value * 0.5);

  // 자산 제거
  player.assets.splice(assetIndex, 1);
  player.assetValue -= asset.value;

  // 현금 증가
  player.cash += receivedAmount;

  // 트랜잭션 기록
  const transaction: Transaction = {
    id: generateId(),
    type: 'SELL_ASSET',
    amount: receivedAmount,
    fromId: 'BANK',
    toId: playerId,
    timestamp: Date.now(),
    description: `자산 매각: ${asset.name}`,
    soldAsset: {
      assetId: asset.id,
      assetName: asset.name || `${asset.type} #${asset.id.slice(-4)}`,
      originalValue: asset.value
    }
  };

  store.transactions.set(transaction.id, transaction);

  return { transaction, receivedAmount };
}
```

### 3.4 게임 종료 투표 타이머

```typescript
// backend/src/services/vote.service.ts
startGameEndVote(roomId: string, requesterId: string) {
  const room = store.getRoom(roomId);

  const vote: GameEndVote = {
    id: generateId(),
    roomId,
    requesterId,
    status: 'IN_PROGRESS',
    votes: Object.fromEntries(
      room.players.map(p => [p.id, null])
    ),
    createdAt: Date.now(),
    expiresAt: Date.now() + 60000,
    timeoutHandledAs: 'APPROVE'
  };

  store.gameEndVotes.set(vote.id, vote);

  // 60초 타이머
  setTimeout(() => {
    this.resolveGameEndVote(vote.id);
  }, 60000);

  return vote;
}

resolveGameEndVote(voteId: string) {
  const vote = store.gameEndVotes.get(voteId);
  if (!vote || vote.status !== 'IN_PROGRESS') return;

  // 미응답 = 동의 처리
  const hasRejection = Object.values(vote.votes).some(v => v === false);

  vote.status = hasRejection ? 'REJECTED' : 'APPROVED';

  return vote;
}
```

## 4. 테스트 체크리스트

### 4.1 금액 버튼 테스트
- [ ] 송금 모달에서 5만/1만/5천/천원 버튼 표시
- [ ] 복지기금 기부에서 15만원 버튼 추가 표시
- [ ] 음수 금액 입력 방지

### 4.2 만원 단위 표시 테스트
- [ ] 150만원 → "150만원"
- [ ] 5000원 → "0.5만원"
- [ ] 3500원 → "0.35만원"
- [ ] 0원 → "0원"

### 4.3 거래 내역 테스트
- [ ] 거래 내역 버튼 클릭 시 모달 열림
- [ ] 본인 관련 거래만 표시
- [ ] 최신순 정렬

### 4.4 알림 시스템 테스트
- [ ] 송금 수신 시 알림 표시
- [ ] 4초 후 자동 소멸
- [ ] 알림 개수 배지 표시

### 4.5 은행 수령 테스트
- [ ] 호스트만 접근 가능
- [ ] 사유 선택 (복권/우승상금/보너스/기타)
- [ ] 거래 내역에 기록

### 4.6 자산 매각 테스트
- [ ] 보유 자산 목록 표시
- [ ] 매각 금액 = 원래 가치의 50%
- [ ] 자산 제거 및 현금 증가

### 4.7 게임 종료 투표 테스트
- [ ] 호스트 요청 시 투표 시작
- [ ] 모든 플레이어에게 투표 팝업
- [ ] 전원 동의 시 게임 종료
- [ ] 1명 거부 시 게임 계속
- [ ] 60초 타임아웃 시 미응답=동의 처리
