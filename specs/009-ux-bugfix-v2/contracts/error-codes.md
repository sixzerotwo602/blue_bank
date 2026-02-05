# Error Codes: UX 버그 수정 및 기능 개선 v2

**Date**: 2026-02-05
**Branch**: `009-ux-bugfix-v2`

## 에러 코드 체계

| 코드 | 메시지 (한글) | 메시지 (영문) | 발생 조건 | 관련 기능 |
|------|--------------|--------------|----------|----------|
| E101 | 거래를 찾을 수 없습니다 | Transaction not found | transactionId가 유효하지 않음 | 거래 취소 |
| E102 | 취소 권한이 없습니다 | Not authorized to cancel | 요청자 ≠ 원래 송금자 | 거래 취소 |
| E103 | 이미 취소된 거래입니다 | Transaction already cancelled | transaction.status = 'CANCELLED' | 거래 취소 |
| E104 | 상대방 잔액이 부족합니다 | Insufficient balance for cancellation | 수신자 현금 < 취소 금액 | 거래 취소 |
| E105 | 취소 요청을 찾을 수 없습니다 | Cancel request not found | requestId가 유효하지 않음 | 거래 취소 응답 |
| E106 | 취소 요청이 만료되었습니다 | Cancel request expired | expiresAt < Date.now() | 거래 취소 응답 |
| E107 | 진행 중인 투표가 있습니다 | Vote already in progress | 동일 방에서 투표 중복 시도 | 투표 요청 |
| E108 | 자산을 찾을 수 없습니다 | Asset not found | assetId가 유효하지 않음 | 자산명 수정 |
| E109 | 토지명을 입력해주세요 | Land name is required | newName이 빈 문자열 | 자산명 수정 |
| E110 | 토지명은 20자 이내로 입력해주세요 | Land name must be 20 characters or less | newName.length > 20 | 자산명 수정 |

---

## 에러 코드 사용 예시

### Backend (핸들러에서 에러 반환)

```typescript
// transaction.handler.ts
socket.on('tx:request_cancel', (transactionId, callback) => {
  const result = transactionService.requestCancelTransaction(transactionId, playerId);

  if ('error' in result) {
    return callback({ success: false, error: result.error });
    // result.error = 'E101' | 'E102' | 'E103' | 'E104'
  }

  callback({ success: true, requestId: result.id });
});
```

### Frontend (에러 메시지 표시)

```typescript
// utils/errorMessages.ts
const ERROR_MESSAGES: Record<string, string> = {
  E101: '거래를 찾을 수 없습니다',
  E102: '취소 권한이 없습니다',
  E103: '이미 취소된 거래입니다',
  E104: '상대방 잔액이 부족합니다',
  E105: '취소 요청을 찾을 수 없습니다',
  E106: '취소 요청이 만료되었습니다',
  E107: '진행 중인 투표가 있습니다',
  E108: '자산을 찾을 수 없습니다',
  E109: '토지명을 입력해주세요',
  E110: '토지명은 20자 이내로 입력해주세요',
};

export const getErrorMessage = (code: string): string => {
  return ERROR_MESSAGES[code] || '알 수 없는 오류가 발생했습니다';
};
```

### 컴포넌트에서 사용

```tsx
// TransactionHistory.tsx
socket.emit('tx:request_cancel', transactionId, (response) => {
  if (!response.success) {
    toast.error(getErrorMessage(response.error));
    return;
  }
  toast.success('취소 요청이 전송되었습니다');
});
```

---

## 에러 코드 범위 규칙

| 범위 | 카테고리 | 설명 |
|------|---------|------|
| E1xx | 거래 관련 | 거래 조회, 취소, 검증 오류 |
| E2xx | 투표 관련 | 투표 생성, 참여, 결과 오류 (예약) |
| E3xx | 자산 관련 | 자산 조회, 수정, 매각 오류 (E108-E110 포함) |
| E4xx | 인증/권한 | 권한 없음, 인증 실패 (예약) |
| E5xx | 시스템 | 내부 서버 오류 (예약) |

---

## 관련 요구사항 매핑

| 에러 코드 | 관련 FR | 사용처 |
|----------|---------|--------|
| E101-E106 | FR-010~FR-015 | 거래 취소 기능 |
| E107 | FR-017 | 은행 수령 투표, 복지기금 투표 |
| E108-E110 | FR-020~FR-022 | 자산명 수정 기능 |
