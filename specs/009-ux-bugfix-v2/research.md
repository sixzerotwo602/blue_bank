# Research: UX 버그 수정 및 기능 개선 v2

**Date**: 2026-02-05
**Branch**: `009-ux-bugfix-v2`

## 1. 송금 모달 버튼 활성화 로직 (이슈 #23)

### 현재 구현 분석

**파일**: `frontend/src/components/TransactionModal.tsx`

현재 송금 모달의 버튼 구조 (line 452-476):
- `type === 'TRANSFER'`일 때 2개 버튼 표시:
  - "플레이어에게 송금" (type="submit", toId 필수)
  - "은행으로 송금" (type="button", PAY_COST로 전환)

**문제점**: 플레이어를 선택해도 "은행으로 송금" 버튼이 여전히 활성화됨

### 해결 방안

**Decision**: 송금 대상(toId) 선택 상태에 따라 버튼 disabled 상태 제어

**Rationale**:
- 플레이어 선택 시 → "은행으로 송금" 버튼 disabled
- 플레이어 미선택 시 → "플레이어에게 송금" 버튼 disabled (기존 로직)
- 상호 배타적 UI로 실수 방지

**구현**:
```tsx
// 은행으로 송금 버튼
disabled={!amount || !!toId}  // toId가 있으면 비활성화
```

---

## 2. 게임 종료 투표 취소 동기화 (이슈 #25)

### 현재 구현 분석

**Backend**: `backend/src/services/vote.service.ts` - `cancelGameEndVote()` (line 198-214)
- 호스트만 취소 가능
- 상태를 'REJECTED'로 변경

**Backend**: `backend/src/handlers/game.handler.ts` - 'game_end_vote:cancel' 이벤트 핸들러 존재

**Frontend**: `frontend/src/components/GameEndVotePopup.tsx` - 투표 UI
**Frontend**: `frontend/src/hooks/useGame.ts` - 'game_end_vote:ended' 이벤트 핸들러

**문제점**:
1. 취소 시 'game_end_vote:cancelled' 별도 이벤트 없음 (ended로만 처리)
2. 모달이 외부 클릭/ESC로 닫힐 수 있음
3. 토스트 알림 메시지 없음

### 해결 방안

**Decision**:
1. 새로운 'game_end_vote:cancelled' 이벤트 추가
2. 모달에 `closeOnOutsideClick={false}`, `closeOnEscape={false}` 속성 추가
3. 취소 시 토스트 알림 표시

**Rationale**: 기존 'ended' 이벤트와 구분하여 명확한 취소 상태 전달

**구현**:
- shared/index.ts: ServerToClientEvents에 'game_end_vote:cancelled' 추가
- game.handler.ts: 취소 시 'cancelled' 이벤트 broadcast
- GameEndVotePopup.tsx: 모달 닫힘 방지 로직 추가
- useGame.ts: cancelled 이벤트 핸들러 + 토스트 표시

---

## 3. 투표 타임아웃 미응답 처리 통일 (FR-009-1, FR-019-1, FR-023)

### 현재 구현 분석

**게임 종료 투표** (`vote.service.ts:160-177`):
- `timeoutHandledAs: 'APPROVE'` - 미응답 시 동의로 처리

**사회복지기금 투표** (`vote.service.ts:8-42`):
- `expiresAt: Date.now() + 60000` 설정만 있고 타임아웃 핸들러 **없음**

### 해결 방안

**Decision**: 모든 투표에서 60초 미응답 시 자동 거절 처리로 통일

**Rationale**:
- 적극적 동의 필요 원칙 (부정행위 방지)
- 게임 진행 중단 방지 (무한 대기 제거)
- 일관된 사용자 경험

**구현**:
1. `GameEndVote.timeoutHandledAs`를 'REJECT'로 변경
2. `Vote` 인터페이스에 `timeoutHandledAs: 'REJECT'` 추가
3. `processGameEndVoteTimeout()` 로직 수정: 미응답 → false
4. `processWelfareVoteTimeout()` 신규 구현
5. game.handler.ts에서 setTimeout으로 타임아웃 핸들러 등록

---

## 4. 토지 매각 시 건물 처리 (이슈 #24)

### 현재 구현 분석

**Backend**: `backend/src/services/transaction.service.ts`
- `SELL_ASSET` 타입 처리 존재 (line 133+)
- 개별 자산 매각만 지원

**Frontend**: `frontend/src/components/SellAssetModal.tsx` 존재

### 해결 방안

**Decision**: 토지 매각 시도 시 건물 존재 여부 확인 → 경고 팝업 → 일괄 매각 옵션

**Rationale**: 건물이 토지에 종속되므로 토지만 매각하면 데이터 불일치 발생

**구현**:
1. Frontend: SellAssetModal에서 토지 선택 시 해당 토지 위 건물 확인
2. 건물 존재 시 ConfirmModal로 경고 표시
3. "일괄 매각" 선택 시 토지 + 건물 모두 매각 요청
4. Backend: 일괄 매각 처리 로직 추가 (SELL_ASSET_BUNDLE 또는 기존 타입 확장)

**매각가 계산**:
- 토지: `land.value * 0.5`
- 건물: `building.value * 0.5`
- 총액: 토지 반값 + 건물 반값

---

## 5. 은행에서 돈 받기 투표 시스템 (이슈 #27)

### 현재 구현 분석

**Backend**: `backend/src/handlers/transaction.handler.ts`
- 'tx:bank_receive' 이벤트: 호스트가 직접 플레이어에게 은행 수령 처리

**Frontend**: `frontend/src/components/BankReceiveModal.tsx`
- 호스트 전용 UI

### 해결 방안

**Decision**:
1. 용어 변경: '수령' → '은행에서 돈 받기'
2. 플레이어가 직접 요청 → 다른 플레이어 투표 → 과반수 동의 시 입금
3. 대출은 투표 제외 (기존 시스템 유지)

**Rationale**: 부정행위 방지, 게임 공정성 향상

**구현**:
1. shared/index.ts: 새로운 투표 타입 'BANK_RECEIVE_VOTE' 추가 또는 기존 Vote 확장
2. vote.service.ts: createBankReceiveVote() 함수 추가
3. vote.handler.ts: 'vote:request_bank_receive' 이벤트 핸들러 추가
4. Frontend: BankReceiveModal 수정 - 요청 버튼 → 투표 시작
5. 투표 완료 시 BANK_RECEIVE 트랜잭션 실행

---

## 6. 거래 취소 기능 (이슈 #26)

### 현재 구현 분석

**Transaction 인터페이스** (shared/index.ts:99-115):
- status 필드 없음 (취소 상태 저장 불가)

**TransactionHistory.tsx**: 거래 내역 표시만

### 해결 방안

**Decision**:
1. Transaction에 `status: 'COMPLETED' | 'CANCELLED' | 'PENDING_CANCEL'` 필드 추가
2. 취소 요청 시 상대방 동의 필요 (플레이어 간)
3. 은행 거래는 즉시 취소
4. 취소 불가 조건: 수신자 잔액 < 취소 금액

**구현**:
1. shared/index.ts: Transaction.status 필드 추가, CancelRequest 타입 추가
2. store.ts: cancelRequests Map 추가
3. transaction.service.ts:
   - requestCancelTransaction()
   - respondCancelRequest()
   - checkCancellable()
4. transaction.handler.ts: 'tx:request_cancel', 'tx:respond_cancel' 이벤트
5. TransactionHistory.tsx: 거래별 취소 버튼 추가

---

## 7. 자산명 수정 기능 (이슈 #28)

### 현재 구현 분석

**Asset 인터페이스** (shared/index.ts:5-12):
- name 필드 존재 (optional)

**PlayerAssetModal.tsx**: 자산 목록 표시

### 해결 방안

**Decision**: 자산명 클릭 시 인라인 편집 또는 수정 팝업

**Rationale**: 간단한 UX로 오타 수정 가능

**구현**:
1. Frontend: PlayerAssetModal에서 토지명 클릭 시 수정 모드 전환
2. 새로운 소켓 이벤트: 'asset:rename'
3. Backend: asset.service.ts 또는 room.service.ts에 renameAsset() 함수
4. 빈 이름 검증 로직

---

## 기술 결정 요약

| 항목 | 결정 | 근거 |
|------|------|------|
| 투표 타임아웃 처리 | 모든 투표 60초 미응답 → 거절 | 적극적 동의 원칙 |
| 투표 취소 이벤트 | 별도 'cancelled' 이벤트 추가 | 상태 명확성 |
| 건물 일괄 매각 | 기존 SELL_ASSET 확장 | 코드 복잡도 최소화 |
| 은행 수령 투표 | 기존 Vote 타입에 voteType 확장 | 일관된 투표 시스템 |
| 거래 취소 | Transaction.status 필드 추가 | 상태 추적 필요 |
| 자산명 수정 | 새 소켓 이벤트 추가 | 실시간 동기화 |
