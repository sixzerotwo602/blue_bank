# Socket Events Contract: UX 버그 수정 및 기능 개선 v2

**Date**: 2026-02-05
**Branch**: `009-ux-bugfix-v2`

## 신규 이벤트 목록

### Server → Client Events

#### 1. 게임 종료 투표 취소
```typescript
'game_end_vote:cancelled'
```

**Payload**:
```typescript
{
  voteId: string;
  cancelledBy: string;  // 호스트 ID
}
```

**발생 조건**: 호스트가 게임 종료 투표를 취소했을 때
**수신 대상**: 해당 방의 모든 플레이어

---

#### 2. 거래 취소 요청 수신
```typescript
'tx:cancel_requested'
```

**Payload**:
```typescript
{
  id: string;
  transactionId: string;
  requesterId: string;
  targetId: string;
  status: 'PENDING';
  createdAt: number;
  expiresAt: number;
}
```

**발생 조건**: 다른 플레이어가 나에게 송금한 거래의 취소를 요청했을 때
**수신 대상**: 취소 요청 대상 플레이어 (targetId)

---

#### 3. 거래 취소 응답
```typescript
'tx:cancel_responded'
```

**Payload**:
```typescript
{
  id: string;
  transactionId: string;
  requesterId: string;
  targetId: string;
  status: 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  respondedAt: number;
}
```

**발생 조건**: 취소 요청에 대한 응답이 완료되었을 때
**수신 대상**: 취소 요청자 (requesterId)

---

#### 4. 거래 취소 완료
```typescript
'tx:cancelled'
```

**Payload**:
```typescript
{
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  timestamp: number;
  status: 'CANCELLED';
  cancelledAt: number;
  cancelledBy: string;
}
```

**발생 조건**: 거래 취소가 최종 완료되었을 때
**수신 대상**: 해당 방의 모든 플레이어

---

#### 5. 은행 수령 투표 시작
```typescript
'bank_receive_vote:started'
```

**Payload**:
```typescript
{
  id: string;
  roomId: string;
  requesterId: string;
  voteType: 'BANK_RECEIVE';
  amount: number;
  status: 'IN_PROGRESS';
  votes: Record<string, boolean>;
  createdAt: number;
  expiresAt: number;
  reason?: string;
  timeoutHandledAs: 'REJECT';
}
```

**발생 조건**: 플레이어가 은행에서 돈 받기를 요청했을 때
**수신 대상**: 해당 방의 모든 플레이어

---

#### 6. 은행 수령 투표 업데이트
```typescript
'bank_receive_vote:updated'
```

**Payload**: `bank_receive_vote:started`와 동일

**발생 조건**: 플레이어가 투표했을 때
**수신 대상**: 해당 방의 모든 플레이어

---

#### 7. 은행 수령 투표 종료
```typescript
'bank_receive_vote:ended'
```

**Payload**:
```typescript
{
  id: string;
  roomId: string;
  requesterId: string;
  voteType: 'BANK_RECEIVE';
  amount: number;
  status: 'APPROVED' | 'REJECTED';
  votes: Record<string, boolean>;
  createdAt: number;
  expiresAt: number;
  reason?: string;
  timeoutHandledAs: 'REJECT';
}
```

**발생 조건**: 투표가 완료(과반수 도달) 또는 타임아웃되었을 때
**수신 대상**: 해당 방의 모든 플레이어

---

#### 8. 자산명 변경
```typescript
'asset:renamed'
```

**Payload**:
```typescript
{
  playerId: string;
  assetId: string;
  oldName: string;
  newName: string;
}
```

**발생 조건**: 플레이어가 자산명을 변경했을 때
**수신 대상**: 해당 방의 모든 플레이어

---

### Client → Server Events

#### 1. 거래 취소 요청
```typescript
'tx:request_cancel'
```

**Payload**:
```typescript
transactionId: string
```

**Callback**:
```typescript
{
  success: boolean;
  error?: string;
  requestId?: string;  // 성공 시 취소 요청 ID
}
```

**검증**:
- 요청자 = 원래 송금자
- 거래 상태 = 'COMPLETED'
- 수신자 잔액 >= 취소 금액

---

#### 2. 거래 취소 응답
```typescript
'tx:respond_cancel'
```

**Payload**:
```typescript
requestId: string;
approve: boolean;
```

**Callback**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**검증**:
- 응답자 = 취소 요청 대상 (targetId)
- 요청 상태 = 'PENDING'
- 요청이 만료되지 않음

---

#### 3. 은행 수령 투표 요청
```typescript
'vote:request_bank_receive'
```

**Payload**:
```typescript
{
  amount: number;
  reason: 'LOTTERY' | 'PRIZE' | 'BONUS' | 'OTHER';
  customReason?: string;  // reason이 'OTHER'일 때
}
```

**Callback**:
```typescript
{
  success: boolean;
  error?: string;
  voteId?: string;
}
```

**검증**:
- 진행 중인 투표 없음
- 금액 > 0

---

#### 4. 자산명 변경
```typescript
'asset:rename'
```

**Payload**:
```typescript
assetId: string;
newName: string;
```

**Callback**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**검증**:
- 요청자가 해당 자산 소유
- 자산 타입 = 'LAND' (토지만 이름 변경 가능)
- newName이 비어있지 않음
- newName 길이 <= 20자

---

## 기존 이벤트 변경

### game_end_vote:cast 응답 변경 없음

기존 동작 유지, 타임아웃 처리만 내부적으로 변경

### vote:cast 변경 없음

기존 동작 유지, 타임아웃 처리만 내부적으로 변경

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| E101 | "거래를 찾을 수 없습니다" | transactionId 무효 |
| E102 | "취소 권한이 없습니다" | 요청자 ≠ 송금자 |
| E103 | "이미 취소된 거래입니다" | status = CANCELLED |
| E104 | "상대방 잔액이 부족합니다" | 취소 불가 |
| E105 | "취소 요청을 찾을 수 없습니다" | requestId 무효 |
| E106 | "취소 요청이 만료되었습니다" | expiresAt < now |
| E107 | "진행 중인 투표가 있습니다" | 동시 투표 제한 |
| E108 | "자산을 찾을 수 없습니다" | assetId 무효 |
| E109 | "자산명을 입력해주세요" | newName 비어있음 |
| E110 | "자산명은 20자 이내로 입력해주세요" | newName 길이 초과 |
