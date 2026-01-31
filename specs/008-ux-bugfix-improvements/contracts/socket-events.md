# Socket.IO Event Contracts: UX 버그 수정 및 기능 개선

**Feature**: 008-ux-bugfix-improvements
**Date**: 2026-02-01

## 개요

이 문서는 008 기능에서 추가/수정되는 Socket.IO 이벤트 계약을 정의합니다.

---

## 신규 이벤트

### 1. game_end_vote:cancel (Client → Server)

게임종료 투표를 취소합니다.

**Payload**:
```typescript
interface GameEndVoteCancelPayload {
  voteId: string;  // 취소할 투표 ID
}
```

**Validation**:
- voteId는 현재 활성화된 게임종료 투표 ID와 일치해야 함
- 요청자는 해당 투표에 이미 응답한 상태여야 함

**Response**:
- 성공: `game_end_vote:updated` 이벤트로 업데이트된 투표 상태 브로드캐스트
- 실패: 에러 콜백 또는 무시

**Example**:
```typescript
// Client
socket.emit('game_end_vote:cancel', { voteId: 'vote-123' });

// Server broadcasts
socket.to(roomId).emit('game_end_vote:updated', updatedVote);
```

---

## 기존 이벤트 수정

### 2. tx:bank_receive (Client → Server)

**변경사항**: 호스트 권한 체크 제거, 모든 플레이어가 본인 계좌로 직접 수령 가능

**기존 Payload**:
```typescript
interface BankReceivePayload {
  roomId: string;
  toPlayerId: string;    // 수령 대상 플레이어 (선택)
  amount: number;
  reason: BankReceiveReason;
  customReason?: string;
}
```

**변경된 Payload**:
```typescript
interface BankReceivePayload {
  roomId: string;
  // toPlayerId 제거 - 항상 요청자 본인에게 지급
  amount: number;
  reason: BankReceiveReason;
  customReason?: string;
}
```

**Validation 변경**:
- ~~호스트만 요청 가능~~ → 모든 플레이어 요청 가능
- 금액 범위: 1 ~ 100,000,000,000,000 (100조)

---

## 이벤트별 알림 연동

### tx:processed 이벤트 시 토스트 알림

| 거래 유형 | 발신자 알림 | 수신자 알림 |
|----------|------------|------------|
| TRANSFER | "송금 완료!" | "[발신자]님이 [금액]을 보냈습니다" |
| BUY_ASSET | "자산 매입 완료!" | - |
| PAY_COST | "납부 완료!" | - |
| DONATE | "기부 완료!" | - |
| SALARY | "급여 수령 완료!" | - |
| WELFARE_RECEIVE | "복지기금 수령 완료!" | - |
| BANK_RECEIVE | "은행 수령 완료!" | - |
| SELL_ASSET | "자산 매각 완료!" | - |

### 에러 시 토스트 알림

| 에러 유형 | 메시지 |
|----------|--------|
| 금액 0 이하 | "금액은 0보다 커야 합니다" |
| 금액 100조 초과 | "최대 100조원까지 입력 가능합니다" |
| 잔액 부족 | "잔액이 부족합니다" |
| 토지명 중복 | "이미 보유한 토지명입니다" |
| 별장 초과 | "해당 토지에는 더 이상 별장을 건설할 수 없습니다" |

---

## 이벤트 시퀀스 다이어그램

### 게임종료 투표 취소 플로우

```
Player A                    Server                     All Players
    |                          |                            |
    |--game_end_vote:cast----->|                            |
    |                          |--game_end_vote:updated---->|
    |                          |                            |
    |--game_end_vote:cancel--->|                            |
    |                          |  (remove A's response)     |
    |                          |--game_end_vote:updated---->|
    |                          |                            |
```

### 은행 수령 (개인화) 플로우

```
Any Player                  Server                     Player (self)
    |                          |                            |
    |--tx:bank_receive-------->|                            |
    |  { amount, reason }      |                            |
    |                          |  (add to player's cash)    |
    |                          |--tx:processed------------->|
    |                          |                            |
    |                          |  (toast: "은행 수령 완료!") |
```

### 토지/건물 매입 플로우

```
Player                      Frontend                   Server
    |                          |                          |
    |--select "토지"---------->|                          |
    |                          |--show 토지명 input       |
    |--input "서울"----------->|                          |
    |                          |--validate duplicate      |
    |                          |  (check myAssets)        |
    |--input amount----------->|                          |
    |                          |--validate max 100조      |
    |--click "매입"----------->|                          |
    |                          |--tx:request------------->|
    |                          |  { type: BUY_ASSET,      |
    |                          |    assetType: LAND,      |
    |                          |    landName: "서울" }    |
    |                          |                          |
```

---

## 타입 정의 (shared/src/index.ts 추가)

```typescript
// ClientToServerEvents 확장
export interface ClientToServerEvents {
  // ... 기존 이벤트들 ...

  /**
   * 게임종료 투표 취소
   * @param data.voteId - 취소할 투표 ID
   */
  'game_end_vote:cancel': (data: { voteId: string }) => void;
}

// BankReceivePayload 수정 (toPlayerId 제거)
export interface BankReceivePayload {
  roomId: string;
  amount: number;
  reason: BankReceiveReason;
  customReason?: string;
}

// BuyAssetPayload 확장
export interface BuyAssetPayload {
  roomId: string;
  assetType: 'LAND' | 'HOTEL' | 'BUILDING' | 'VILLA';
  amount: number;
  landName?: string;      // 토지인 경우 토지명
  targetLandId?: string;  // 건물인 경우 대상 토지 ID
  villaCount?: number;    // 별장인 경우 갯수 (1 또는 2)
}
```

---

## 하위 호환성

| 이벤트 | 하위 호환성 | 마이그레이션 필요 |
|--------|------------|------------------|
| game_end_vote:cancel | 신규 이벤트 | 없음 |
| tx:bank_receive | toPlayerId 무시 | 클라이언트 업데이트 권장 |
| tx:request (BUY_ASSET) | 기존 필드 유지 | 신규 필드 선택적 |

---

## 테스트 시나리오

### TC-001: 게임종료 투표 취소
1. 플레이어 A가 게임종료 투표에 찬성
2. game_end_vote:updated 이벤트로 A의 찬성 확인
3. 플레이어 A가 game_end_vote:cancel 호출
4. game_end_vote:updated 이벤트로 A의 응답 제거 확인

### TC-002: 은행 수령 개인화
1. 일반 플레이어(비호스트)가 tx:bank_receive 호출
2. 요청자 본인 계좌에 금액 추가 확인
3. tx:processed 이벤트 수신 확인

### TC-003: 금액 100조 제한
1. 100조 초과 금액으로 tx:request 호출
2. 에러 응답 또는 입력 차단 확인
3. 붙여넣기로 100조 초과 입력 시도 → 차단 확인
