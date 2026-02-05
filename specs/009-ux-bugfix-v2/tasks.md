# Tasks: UX 버그 수정 및 기능 개선 v2

**Branch**: `009-ux-bugfix-v2` | **Generated**: 2026-02-05
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 0: Setup & Type Definitions

### Task 0.1: shared/index.ts 타입 확장

**File**: `shared/src/index.ts`
**Requirements**: FR-010, FR-015, FR-017, FR-019-1, FR-023

**Changes**:
1. `TransactionStatus` 타입 추가:
   ```typescript
   export type TransactionStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING_CANCEL';
   ```

2. `Transaction` 인터페이스 확장:
   ```typescript
   export interface Transaction {
     // ... 기존 필드
     status: TransactionStatus;
     cancelledAt?: number;
     cancelledBy?: string;
   }
   ```

3. `CancelRequest` 인터페이스 추가:
   ```typescript
   export interface CancelRequest {
     id: string;
     transactionId: string;
     requesterId: string;
     targetId: string;
     status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
     createdAt: number;
     expiresAt: number;
     respondedAt?: number;
   }
   ```

4. `VoteType` 확장:
   ```typescript
   export type VoteType = 'WELFARE' | 'GAME_END' | 'BANK_RECEIVE';
   ```

5. `Vote` 인터페이스에 `timeoutHandledAs` 추가:
   ```typescript
   export interface Vote {
     // ... 기존 필드
     timeoutHandledAs: 'REJECT';
   }
   ```

6. `GameEndVote` 인터페이스 수정:
   ```typescript
   export interface GameEndVote {
     // ... 기존 필드
     status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
     timeoutHandledAs: 'REJECT';  // 'APPROVE' → 'REJECT' 변경
   }
   ```

**Verification**: TypeScript 컴파일 성공 (`npm run build` in shared/)

---

### Task 0.2: Socket 이벤트 타입 정의

**File**: `shared/src/index.ts`
**Requirements**: FR-007, FR-011, FR-017

**Changes**:
1. `ServerToClientEvents` 확장:
   ```typescript
   // 게임 종료 투표 취소
   'game_end_vote:cancelled': (payload: { voteId: string; cancelledBy: string }) => void;

   // 거래 취소 이벤트
   'tx:cancel_requested': (request: CancelRequest) => void;
   'tx:cancel_responded': (request: CancelRequest) => void;
   'tx:cancelled': (transaction: Transaction) => void;

   // 은행 수령 투표 이벤트
   'bank_receive_vote:started': (vote: Vote) => void;
   'bank_receive_vote:updated': (vote: Vote) => void;
   'bank_receive_vote:ended': (vote: Vote) => void;

   // 자산명 변경
   'asset:renamed': (payload: { playerId: string; assetId: string; oldName: string; newName: string }) => void;
   ```

2. `ClientToServerEvents` 확장:
   ```typescript
   // 거래 취소 요청
   'tx:request_cancel': (transactionId: string, callback: (response: { success: boolean; error?: string; requestId?: string }) => void) => void;

   // 거래 취소 응답
   'tx:respond_cancel': (requestId: string, approve: boolean, callback: (response: { success: boolean; error?: string }) => void) => void;

   // 은행 수령 투표 요청
   'vote:request_bank_receive': (payload: { amount: number; reason: BankReceiveReason; customReason?: string }, callback: (response: { success: boolean; error?: string; voteId?: string }) => void) => void;

   // 자산명 변경
   'asset:rename': (assetId: string, newName: string, callback: (response: { success: boolean; error?: string }) => void) => void;
   ```

**Verification**: TypeScript 컴파일 성공

---

### Task 0.3: Backend Store 확장

**File**: `backend/src/models/store.ts`
**Requirements**: FR-010, FR-011

**Changes**:
1. `cancelRequests` Map 추가:
   ```typescript
   cancelRequests: Map<string, CancelRequest> = new Map();
   ```

2. `voteTimeouts` Map 추가 (투표 타임아웃 타이머 관리):
   ```typescript
   voteTimeouts: Map<string, NodeJS.Timeout> = new Map();
   ```

**Verification**: Backend 컴파일 성공

---

## Phase 1: 송금 모달 UI 오류 수정 (US1, P1)

### Task 1.1: 송금 버튼 비활성화 로직 수정

**File**: `frontend/src/components/TransactionModal.tsx`
**Requirements**: FR-001, FR-002, FR-003

**Changes**:
1. "은행으로 송금" 버튼의 `disabled` 조건 수정:
   ```tsx
   <button
     type="button"
     onClick={() => { /* 은행으로 송금 */ }}
     disabled={!amount || !!toId}  // toId가 있으면 비활성화
     className="..."
   >
     은행으로 송금
   </button>
   ```

2. "플레이어에게 송금" 버튼은 기존 로직 유지 (toId 필수)

**Verification**:
- 플레이어 선택 시 "은행으로 송금" 버튼 disabled 확인
- 플레이어 선택 해제 시 버튼 enabled 확인

---

## Phase 2: 게임 종료 투표 취소 동기화 (US2, P1)

### Task 2.1: 게임 종료 투표 취소 이벤트 핸들러 추가

**File**: `backend/src/handlers/game.handler.ts`
**Requirements**: FR-007

**Changes**:
1. `'game_end_vote:cancel'` 핸들러에서 취소 시 `'game_end_vote:cancelled'` 이벤트 broadcast 추가:
   ```typescript
   io.to(roomId).emit('game_end_vote:cancelled', {
     voteId: vote.id,
     cancelledBy: playerId
   });
   ```

**Verification**: 호스트 취소 시 모든 클라이언트에게 이벤트 전송 확인

---

### Task 2.2: 게임 종료 투표 모달 닫힘 방지

**File**: `frontend/src/components/GameEndVotePopup.tsx`
**Requirements**: FR-009

**Changes**:
1. Modal 컴포넌트에 닫힘 방지 props 추가:
   ```tsx
   <Modal
     isOpen={isOpen}
     onClose={() => {}}  // 닫기 함수 무효화
     closeOnOutsideClick={false}
     closeOnEscape={false}
   >
   ```

**Verification**: 모달 외부 클릭, ESC 키로 닫히지 않음 확인

---

### Task 2.3: 프론트엔드 취소 이벤트 핸들러 추가

**File**: `frontend/src/hooks/useGame.ts`
**Requirements**: FR-007, FR-008

**Changes**:
1. `'game_end_vote:cancelled'` 이벤트 리스너 추가:
   ```typescript
   socket.on('game_end_vote:cancelled', (payload) => {
     setGameEndVote(null);
     toast.success('게임종료 투표가 취소되었습니다');
   });
   ```

**Verification**: 투표 취소 시 모달 닫힘 + 토스트 알림 확인

---

### Task 2.4: 게임 종료 투표 타임아웃 로직 수정

**File**: `backend/src/services/vote.service.ts`
**Requirements**: FR-009-1

**Changes**:
1. `processGameEndVoteTimeout()` 함수 수정 - 미응답 플레이어를 거절로 처리:
   ```typescript
   processGameEndVoteTimeout(voteId: string): GameEndVote | null {
     const vote = store.gameEndVotes.get(voteId);
     if (!vote || vote.status !== 'IN_PROGRESS') return null;

     const room = store.rooms.get(vote.roomId);
     if (!room) return null;

     // 미응답 플레이어 = 거절로 처리
     for (const player of room.players) {
       if (vote.votes[player.id] === null) {
         vote.votes[player.id] = false;  // REJECT
       }
     }

     this.checkGameEndVoteOutcome(vote);
     return vote;
   }
   ```

2. `createGameEndVote()` 함수에서 `timeoutHandledAs: 'REJECT'` 설정 (기존 'APPROVE'에서 변경)

**Verification**: 60초 타임아웃 후 미응답 플레이어가 거절로 처리됨 확인

---

## Phase 3: 사회복지기금 투표 타임아웃 구현 (FR-023)

### Task 3.1: 사회복지기금 투표 타임아웃 핸들러 구현

**File**: `backend/src/services/vote.service.ts`
**Requirements**: FR-023

**Changes**:
1. `processWelfareVoteTimeout()` 함수 신규 구현:
   ```typescript
   processWelfareVoteTimeout(voteId: string): Vote | null {
     const vote = store.votes.get(voteId);
     if (!vote || vote.status !== 'IN_PROGRESS') return null;

     const room = store.rooms.get(vote.roomId);
     if (!room) return null;

     // 미응답 플레이어 = 거절로 처리
     for (const player of room.players) {
       if (!(player.id in vote.votes)) {
         vote.votes[player.id] = false;
       }
     }

     this.checkVoteOutcome(vote);
     return vote;
   }
   ```

**Verification**: 60초 타임아웃 후 미응답 플레이어가 거절로 처리됨 확인

---

### Task 3.2: 투표 타임아웃 타이머 등록

**File**: `backend/src/handlers/vote.handler.ts`
**Requirements**: FR-023, FR-009-1

**Changes**:
1. `vote:request_fund` 핸들러에서 setTimeout 등록:
   ```typescript
   const timeoutId = setTimeout(() => {
     const result = voteService.processWelfareVoteTimeout(vote.id);
     if (result) {
       io.to(roomId).emit('vote:ended', result);
     }
     store.voteTimeouts.delete(vote.id);
   }, 60000);
   store.voteTimeouts.set(vote.id, timeoutId);
   ```

2. 투표 완료 시 타이머 정리:
   ```typescript
   if (vote.status !== 'IN_PROGRESS') {
     const timeoutId = store.voteTimeouts.get(vote.id);
     if (timeoutId) {
       clearTimeout(timeoutId);
       store.voteTimeouts.delete(vote.id);
     }
   }
   ```

**Verification**: 투표 완료 또는 타임아웃 시 타이머 정리 확인

---

## Phase 4: 토지 매각 시 건물 일괄 처리 (US3, P2)

### Task 4.1: Asset 인터페이스에 landId 필드 추가

**File**: `shared/src/index.ts`
**Requirements**: FR-004, FR-005

**Changes**:
1. `Asset` 인터페이스 확장:
   ```typescript
   export interface Asset {
     // ... 기존 필드
     landId?: string;  // 건물이 위치한 토지 ID (건물인 경우)
   }
   ```

**Verification**: TypeScript 컴파일 성공

---

### Task 4.2: SellAssetModal 건물 확인 로직 추가

**File**: `frontend/src/components/SellAssetModal.tsx`
**Requirements**: FR-004

**Changes**:
1. 토지 선택 시 해당 토지 위 건물 확인:
   ```typescript
   const buildingsOnLand = player.assets.filter(
     asset => asset.type === 'BUILDING' && asset.landId === selectedLandId
   );
   ```

2. 건물 존재 시 경고 모달 표시:
   ```tsx
   {buildingsOnLand.length > 0 && (
     <ConfirmModal
       isOpen={showBuildingWarning}
       title="건물 포함 매각"
       message="건물이 포함된 상태입니다. 건물을 먼저 매각하거나 함께 일괄 매각하시겠습니까?"
       confirmText="일괄 매각"
       cancelText="취소"
       onConfirm={handleBundleSell}
       onCancel={() => setShowBuildingWarning(false)}
     />
   )}
   ```

**Verification**: 건물 있는 토지 선택 시 경고 팝업 표시 확인

---

### Task 4.3: 일괄 매각 Backend 로직 구현

**File**: `backend/src/services/transaction.service.ts`
**Requirements**: FR-005, FR-006

**Changes**:
1. `sellAssetBundle()` 함수 추가 또는 기존 `sellAsset()` 확장:
   ```typescript
   sellAssetBundle(playerId: string, landId: string): { success: boolean; totalAmount: number } {
     const player = this.getPlayer(playerId);
     const land = player.assets.find(a => a.id === landId && a.type === 'LAND');
     const buildings = player.assets.filter(a => a.landId === landId);

     const landAmount = land.value * 0.5;
     const buildingAmount = buildings.reduce((sum, b) => sum + b.value * 0.5, 0);
     const totalAmount = landAmount + buildingAmount;

     // 자산 제거 및 현금 입금
     player.assets = player.assets.filter(a => a.id !== landId && a.landId !== landId);
     player.cash += totalAmount;

     return { success: true, totalAmount };
   }
   ```

**Verification**: 토지 50만 + 건물 30만 → 총 40만원 입금 확인

---

### Task 4.4: 일괄 매각 소켓 핸들러 추가

**File**: `backend/src/handlers/transaction.handler.ts`
**Requirements**: FR-005, FR-006

**Changes**:
1. `'tx:sell_asset'` 핸들러에서 `bundleSell` 옵션 처리:
   ```typescript
   socket.on('tx:sell_asset', (payload, callback) => {
     const { assetId, bundleSell } = payload;

     if (bundleSell) {
       const result = transactionService.sellAssetBundle(playerId, assetId);
       callback({ success: result.success, receivedAmount: result.totalAmount });
     } else {
       // 기존 개별 매각 로직
     }
   });
   ```

**Verification**: bundleSell=true 시 일괄 매각 처리 확인

---

## Phase 5: 은행에서 돈 받기 투표 시스템 (US4, P2)

### Task 5.1: 은행 수령 투표 서비스 구현

**File**: `backend/src/services/vote.service.ts`
**Requirements**: FR-017, FR-018, FR-019-1

**Changes**:
1. `createBankReceiveVote()` 함수 추가:
   ```typescript
   createBankReceiveVote(roomId: string, requesterId: string, amount: number, reason: BankReceiveReason, customReason?: string): Vote {
     const vote: Vote = {
       id: generateId(),
       roomId,
       requesterId,
       voteType: 'BANK_RECEIVE',
       amount,
       status: 'IN_PROGRESS',
       votes: {},
       createdAt: Date.now(),
       expiresAt: Date.now() + 60000,
       timeoutHandledAs: 'REJECT',
       reason: reason === 'OTHER' ? customReason : reason
     };
     store.votes.set(vote.id, vote);
     return vote;
   }
   ```

**Verification**: 은행 수령 투표 생성 확인

---

### Task 5.2: 은행 수령 투표 핸들러 구현

**File**: `backend/src/handlers/vote.handler.ts`
**Requirements**: FR-017, FR-018, FR-019

**Changes**:
1. `'vote:request_bank_receive'` 핸들러 추가:
   ```typescript
   socket.on('vote:request_bank_receive', (payload, callback) => {
     const { amount, reason, customReason } = payload;

     // 진행 중인 투표 확인
     const existingVote = voteService.getActiveVote(roomId);
     if (existingVote) {
       return callback({ success: false, error: 'E107' });
     }

     const vote = voteService.createBankReceiveVote(roomId, playerId, amount, reason, customReason);

     // 타임아웃 설정
     const timeoutId = setTimeout(() => {
       const result = voteService.processVoteTimeout(vote.id);
       if (result) {
         io.to(roomId).emit('bank_receive_vote:ended', result);
       }
     }, 60000);
     store.voteTimeouts.set(vote.id, timeoutId);

     io.to(roomId).emit('bank_receive_vote:started', vote);
     callback({ success: true, voteId: vote.id });
   });
   ```

2. 투표 결과 처리 - 승인 시 입금:
   ```typescript
   if (vote.status === 'APPROVED') {
     transactionService.bankReceive(vote.requesterId, vote.amount, vote.reason);
   }
   ```

3. **대출(LOAN) 예외 처리** (FR-019):
   - 대출은 기존 `tx:request` 핸들러의 `BANK_RECEIVE` 타입으로 즉시 처리
   - `vote:request_bank_receive`는 복권/우승상금/보너스/기타 사유에만 사용
   - 대출 요청 시 투표 없이 즉시 처리되는 기존 로직 유지:
   ```typescript
   // tx:request 핸들러 내 (기존 로직 유지)
   if (tx.type === 'BANK_RECEIVE' && tx.reason === 'LOAN') {
     // 투표 없이 즉시 대출 처리 (기존 시스템)
     transactionService.processLoan(playerId, tx.amount);
     return callback({ success: true });
   }
   ```

**Verification**:
- 투표 요청 → 과반수 동의 → 입금 흐름 확인
- 대출 요청 시 투표 없이 즉시 처리 확인

---

### Task 5.3: BankReceiveModal 투표 시스템 전환

**File**: `frontend/src/components/BankReceiveModal.tsx`
**Requirements**: FR-016, FR-017

**Changes**:
1. 용어 변경: '수령' → '은행에서 돈 받기'
2. 요청 버튼 클릭 시 투표 시작:
   ```typescript
   const handleRequest = () => {
     socket.emit('vote:request_bank_receive', {
       amount,
       reason,
       customReason
     }, (response) => {
       if (response.success) {
         toast.success('투표 요청이 전송되었습니다');
         onClose();
       } else {
         toast.error(getErrorMessage(response.error));
       }
     });
   };
   ```

**Verification**: 요청 시 다른 플레이어에게 투표 모달 표시 확인

---

### Task 5.4: 은행 수령 투표 모달 구현

**File**: `frontend/src/components/BankReceiveVotePopup.tsx` (신규)
**Requirements**: FR-017, FR-018

**Changes**:
1. 새로운 컴포넌트 생성:
   ```tsx
   export const BankReceiveVotePopup: React.FC<{
     vote: Vote;
     onVote: (approve: boolean) => void;
   }> = ({ vote, onVote }) => {
     return (
       <Modal isOpen={true} closeOnOutsideClick={false} closeOnEscape={false}>
         <h2>{requesterName}님이 은행에서 {formatAmount(vote.amount)}원 받기를 요청합니다</h2>
         <p>사유: {vote.reason}</p>
         <div className="flex gap-4">
           <button onClick={() => onVote(true)}>동의</button>
           <button onClick={() => onVote(false)}>거부</button>
         </div>
       </Modal>
     );
   };
   ```

**Verification**: 투표 요청 시 모달 표시 확인

---

### Task 5.5: useGame 훅에 은행 수령 투표 이벤트 추가

**File**: `frontend/src/hooks/useGame.ts`
**Requirements**: FR-017, FR-018

**Changes**:
1. 은행 수령 투표 이벤트 리스너 추가:
   ```typescript
   socket.on('bank_receive_vote:started', (vote) => {
     setBankReceiveVote(vote);
   });

   socket.on('bank_receive_vote:updated', (vote) => {
     setBankReceiveVote(vote);
   });

   socket.on('bank_receive_vote:ended', (vote) => {
     setBankReceiveVote(null);
     if (vote.status === 'APPROVED') {
       toast.success(`${requesterName}님의 요청이 승인되었습니다`);
     } else {
       toast.error(`${requesterName}님의 요청이 거절되었습니다`);
     }
   });
   ```

**Verification**: 투표 시작/업데이트/종료 이벤트 처리 확인

---

## Phase 6: 거래 취소 기능 (US5, P3)

### Task 6.1: 거래 취소 서비스 구현

**File**: `backend/src/services/transaction.service.ts`
**Requirements**: FR-010, FR-011, FR-012, FR-013, FR-014

**Changes**:
1. `requestCancelTransaction()` 함수 추가:
   ```typescript
   requestCancelTransaction(transactionId: string, requesterId: string): CancelRequest | { error: string } {
     const transaction = this.getTransaction(transactionId);

     // 검증
     if (!transaction) return { error: 'E101' };
     if (transaction.fromId !== requesterId) return { error: 'E102' };
     if (transaction.status === 'CANCELLED') return { error: 'E103' };

     // 은행 거래는 즉시 취소
     if (transaction.toId === 'BANK' || transaction.toId === 'FUND') {
       return this.cancelTransaction(transactionId, requesterId);
     }

     // 상대방 잔액 확인
     const targetPlayer = this.getPlayer(transaction.toId);
     if (targetPlayer.cash < transaction.amount) return { error: 'E104' };

     // 취소 요청 생성
     const request: CancelRequest = {
       id: generateId(),
       transactionId,
       requesterId,
       targetId: transaction.toId,
       status: 'PENDING',
       createdAt: Date.now(),
       expiresAt: Date.now() + 60000
     };
     store.cancelRequests.set(request.id, request);
     return request;
   }
   ```

2. `respondCancelRequest()` 함수 추가:
   ```typescript
   respondCancelRequest(requestId: string, responderId: string, approve: boolean): CancelRequest | { error: string } {
     const request = store.cancelRequests.get(requestId);

     if (!request) return { error: 'E105' };
     if (request.targetId !== responderId) return { error: 'E102' };
     if (request.status !== 'PENDING') return { error: 'E105' };
     if (Date.now() > request.expiresAt) return { error: 'E106' };

     request.status = approve ? 'APPROVED' : 'REJECTED';
     request.respondedAt = Date.now();

     if (approve) {
       this.cancelTransaction(request.transactionId, request.requesterId);
     }

     return request;
   }
   ```

3. `cancelTransaction()` 함수 추가:
   ```typescript
   cancelTransaction(transactionId: string, cancelledBy: string): Transaction {
     const transaction = this.getTransaction(transactionId);

     // 자산 복원
     const fromPlayer = this.getPlayer(transaction.fromId);
     const toPlayer = this.getPlayer(transaction.toId);

     fromPlayer.cash += transaction.amount;
     if (toPlayer && typeof transaction.toId === 'string') {
       toPlayer.cash -= transaction.amount;
     }

     transaction.status = 'CANCELLED';
     transaction.cancelledAt = Date.now();
     transaction.cancelledBy = cancelledBy;

     return transaction;
   }
   ```

**Verification**: 거래 취소 요청/응답/완료 흐름 확인

---

### Task 6.2: 거래 취소 소켓 핸들러 구현

**File**: `backend/src/handlers/transaction.handler.ts`
**Requirements**: FR-010, FR-011, FR-012

**Changes**:
1. `'tx:request_cancel'` 핸들러 추가:
   ```typescript
   socket.on('tx:request_cancel', (transactionId, callback) => {
     const result = transactionService.requestCancelTransaction(transactionId, playerId);

     if ('error' in result) {
       return callback({ success: false, error: result.error });
     }

     // 플레이어 간 거래인 경우 상대방에게 알림
     if (result.targetId !== 'BANK' && result.targetId !== 'FUND') {
       io.to(result.targetId).emit('tx:cancel_requested', result);

       // 타임아웃 설정
       setTimeout(() => {
         const request = store.cancelRequests.get(result.id);
         if (request && request.status === 'PENDING') {
           request.status = 'EXPIRED';
           io.to(result.requesterId).emit('tx:cancel_responded', request);
         }
       }, 60000);
     }

     callback({ success: true, requestId: result.id });
   });
   ```

2. `'tx:respond_cancel'` 핸들러 추가:
   ```typescript
   socket.on('tx:respond_cancel', (requestId, approve, callback) => {
     const result = transactionService.respondCancelRequest(requestId, playerId, approve);

     if ('error' in result) {
       return callback({ success: false, error: result.error });
     }

     io.to(result.requesterId).emit('tx:cancel_responded', result);

     if (result.status === 'APPROVED') {
       const transaction = transactionService.getTransaction(result.transactionId);
       io.to(roomId).emit('tx:cancelled', transaction);
     }

     callback({ success: true });
   });
   ```

**Verification**: 취소 요청/응답 소켓 이벤트 흐름 확인

---

### Task 6.3: TransactionHistory 거래 취소 UI 추가

**File**: `frontend/src/components/TransactionHistory.tsx`
**Requirements**: FR-010, FR-014, FR-015

**Changes**:
1. 거래별 취소 버튼 추가:
   ```tsx
   {transaction.fromId === myId && transaction.status === 'COMPLETED' && (
     <button
       onClick={() => handleCancelRequest(transaction.id)}
       disabled={!canCancel(transaction)}
       className="text-red-500 hover:text-red-700 disabled:opacity-50"
     >
       취소
     </button>
   )}
   ```

2. 취소 가능 여부 확인 함수:
   ```typescript
   const canCancel = (transaction: Transaction) => {
     if (transaction.toId === 'BANK' || transaction.toId === 'FUND') return true;
     const targetPlayer = players.find(p => p.id === transaction.toId);
     return targetPlayer && targetPlayer.cash >= transaction.amount;
   };
   ```

3. 취소된 거래 표시:
   ```tsx
   {transaction.status === 'CANCELLED' && (
     <span className="text-gray-400 line-through">취소됨</span>
   )}
   ```

**Verification**: 취소 버튼 표시, 비활성화 조건, 취소됨 표시 확인

---

### Task 6.4: 거래 취소 요청 모달 구현

**File**: `frontend/src/components/CancelRequestPopup.tsx` (신규)
**Requirements**: FR-011

**Changes**:
1. 취소 요청 수신 모달:
   ```tsx
   export const CancelRequestPopup: React.FC<{
     request: CancelRequest;
     transaction: Transaction;
     onRespond: (approve: boolean) => void;
   }> = ({ request, transaction, onRespond }) => {
     return (
       <Modal isOpen={true} closeOnOutsideClick={false}>
         <h2>거래 취소 요청</h2>
         <p>{requesterName}님이 {formatAmount(transaction.amount)}원 송금 취소를 요청합니다</p>
         <div className="flex gap-4">
           <button onClick={() => onRespond(true)}>동의</button>
           <button onClick={() => onRespond(false)}>거부</button>
         </div>
       </Modal>
     );
   };
   ```

**Verification**: 취소 요청 수신 시 모달 표시 확인

---

### Task 6.5: useGame 훅에 거래 취소 이벤트 추가

**File**: `frontend/src/hooks/useGame.ts`
**Requirements**: FR-010, FR-011, FR-013

**Changes**:
1. 거래 취소 이벤트 리스너 추가:
   ```typescript
   socket.on('tx:cancel_requested', (request) => {
     setCancelRequest(request);
   });

   socket.on('tx:cancel_responded', (request) => {
     setCancelRequest(null);
     if (request.status === 'APPROVED') {
       toast.success('거래 취소가 승인되었습니다');
     } else if (request.status === 'REJECTED') {
       toast.error('거래 취소가 거절되었습니다');
     } else {
       toast.error('거래 취소 요청이 만료되었습니다');
     }
   });

   socket.on('tx:cancelled', (transaction) => {
     // 거래 내역 업데이트
     updateTransaction(transaction);
   });
   ```

**Verification**: 취소 요청/응답/완료 이벤트 처리 확인

---

## Phase 7: 자산명 수정 기능 (US6, P3)

### Task 7.1: 자산명 수정 서비스 구현

**File**: `backend/src/services/room.service.ts`
**Requirements**: FR-020, FR-021, FR-022

**Changes**:
1. `renameAsset()` 함수 추가:
   ```typescript
   renameAsset(playerId: string, assetId: string, newName: string): { success: boolean; error?: string; oldName?: string } {
     // 검증
     if (!newName || newName.trim() === '') {
       return { success: false, error: 'E109' };
     }
     if (newName.length > 20) {
       return { success: false, error: 'E110' };
     }

     const player = this.getPlayer(playerId);
     const asset = player.assets.find(a => a.id === assetId);

     if (!asset) {
       return { success: false, error: 'E108' };
     }
     if (asset.type !== 'LAND') {
       return { success: false, error: 'E108' };  // 토지만 수정 가능
     }

     const oldName = asset.name || '';
     asset.name = newName.trim();

     return { success: true, oldName };
   }
   ```

**Verification**: 자산명 변경 검증 로직 확인

---

### Task 7.2: 자산명 수정 소켓 핸들러 구현

**File**: `backend/src/handlers/room.handler.ts` 또는 `asset.handler.ts` (신규)
**Requirements**: FR-020, FR-021

**Changes**:
1. `'asset:rename'` 핸들러 추가:
   ```typescript
   socket.on('asset:rename', (assetId, newName, callback) => {
     const result = roomService.renameAsset(playerId, assetId, newName);

     if (!result.success) {
       return callback({ success: false, error: result.error });
     }

     // 모든 플레이어에게 알림
     io.to(roomId).emit('asset:renamed', {
       playerId,
       assetId,
       oldName: result.oldName,
       newName
     });

     callback({ success: true });
   });
   ```

**Verification**: 자산명 변경 소켓 이벤트 흐름 확인

---

### Task 7.3: PlayerAssetModal 자산명 수정 UI 추가

**File**: `frontend/src/components/PlayerAssetModal.tsx`
**Requirements**: FR-020, FR-021, FR-022

**Changes**:
1. 토지명 클릭 시 수정 모드 전환:
   ```tsx
   const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
   const [editName, setEditName] = useState('');

   const handleNameClick = (asset: Asset) => {
     if (asset.type === 'LAND' && asset.playerId === myId) {
       setEditingAssetId(asset.id);
       setEditName(asset.name || '');
     }
   };
   ```

2. 인라인 편집 또는 수정 팝업:
   ```tsx
   {editingAssetId === asset.id ? (
     <input
       value={editName}
       onChange={(e) => setEditName(e.target.value)}
       onBlur={handleSave}
       onKeyDown={(e) => e.key === 'Enter' && handleSave()}
       autoFocus
     />
   ) : (
     <span onClick={() => handleNameClick(asset)} className="cursor-pointer hover:underline">
       {asset.name}
     </span>
   )}
   ```

3. 저장 함수:
   ```typescript
   const handleSave = () => {
     if (!editName.trim()) {
       toast.error('토지명을 입력해주세요');
       return;
     }

     socket.emit('asset:rename', editingAssetId, editName, (response) => {
       if (response.success) {
         toast.success('토지명이 변경되었습니다');
       } else {
         toast.error(getErrorMessage(response.error));
       }
       setEditingAssetId(null);
     });
   };
   ```

**Verification**: 토지명 클릭 → 수정 → 저장 흐름 확인

---

### Task 7.4: useGame 훅에 자산명 변경 이벤트 추가

**File**: `frontend/src/hooks/useGame.ts`
**Requirements**: FR-020

**Changes**:
1. 자산명 변경 이벤트 리스너 추가:
   ```typescript
   socket.on('asset:renamed', (payload) => {
     const { playerId, assetId, newName } = payload;
     setRoom(prev => ({
       ...prev,
       players: prev.players.map(p => {
         if (p.id === playerId) {
           return {
             ...p,
             assets: p.assets.map(a =>
               a.id === assetId ? { ...a, name: newName } : a
             )
           };
         }
         return p;
       })
     }));
   });
   ```

**Verification**: 자산명 변경 시 모든 클라이언트에 반영 확인

---

## Phase 8: Polish & Integration Testing

### Task 8.1: 용어 통일 ('수령' → '은행에서 돈 받기')

**Files**:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/BankReceiveModal.tsx`
- 기타 관련 컴포넌트

**Requirements**: FR-016

**Changes**:
1. 모든 '수령' 텍스트를 '은행에서 돈 받기'로 변경
2. 버튼 레이블, 모달 제목, 토스트 메시지 등 확인

**Verification**: UI 전체에서 용어 통일 확인

---

### Task 8.2: 통합 테스트

**Requirements**: All

**Test Cases**:
1. **송금 모달 (US1)**: 플레이어 선택 시 은행 버튼 비활성화
2. **게임 종료 투표 (US2)**: 호스트 취소 → 모든 클라이언트 모달 닫힘 + 토스트
3. **투표 타임아웃**: 게임종료/사회복지/은행수령 모두 60초 후 자동 거절
4. **건물 일괄 매각 (US3)**: 토지 50만 + 건물 30만 → 40만원 입금
5. **은행 수령 투표 (US4)**: 요청 → 과반수 동의/거부 → 결과 반영
6. **거래 취소 (US5)**: 요청 → 동의 → 자산 복원, 잔액 부족 시 버튼 비활성화
7. **자산명 수정 (US6)**: 클릭 → 수정 → 저장 → 반영

**Verification**: 모든 Acceptance Scenarios 통과

---

## Summary

| Phase | Tasks | Priority | Est. Effort |
|-------|-------|----------|-------------|
| 0 | Setup & Types | - | Small |
| 1 | 송금 모달 UI (US1) | P1 | Small |
| 2 | 게임 종료 투표 취소 (US2) | P1 | Medium |
| 3 | 사회복지기금 타임아웃 | P1 | Small |
| 4 | 건물 일괄 매각 (US3) | P2 | Medium |
| 5 | 은행 수령 투표 (US4) | P2 | Large |
| 6 | 거래 취소 (US5) | P3 | Large |
| 7 | 자산명 수정 (US6) | P3 | Small |
| 8 | Polish & Testing | - | Medium |

**Total Tasks**: 25
**Dependencies**: Phase 0 → Phase 1-7 (parallel possible within priority) → Phase 8
