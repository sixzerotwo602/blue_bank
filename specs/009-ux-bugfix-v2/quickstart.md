# Quickstart: UX 버그 수정 및 기능 개선 v2

**Date**: 2026-02-05
**Branch**: `009-ux-bugfix-v2`

## 빠른 시작

### 1. 개발 환경 실행

```bash
# 터미널 1: Backend
cd backend && npm run dev

# 터미널 2: Frontend
cd frontend && npm run dev
```

### 2. 브라우저에서 테스트

http://localhost:15485 접속

---

## 주요 변경 사항 테스트

### 이슈 #23: 송금 버튼 활성화 오류 테스트

1. 게임 참여 (2명 이상)
2. "송금하기" 버튼 클릭
3. **다른 플레이어 선택**
4. ✅ 확인: "은행으로 송금" 버튼이 **비활성화** 상태
5. 플레이어 선택 해제
6. ✅ 확인: "은행으로 송금" 버튼이 **활성화** 상태

### 이슈 #25: 게임 종료 투표 취소 테스트

1. 호스트가 게임 종료 투표 시작
2. 다른 플레이어 화면에서 투표 모달 확인
3. **모달 외부 클릭** → ✅ 확인: 모달이 닫히지 않음
4. **ESC 키 입력** → ✅ 확인: 모달이 닫히지 않음
5. 호스트가 투표 취소
6. ✅ 확인: 모든 플레이어 화면에서 모달 즉시 닫힘
7. ✅ 확인: "게임종료 투표가 취소되었습니다" 토스트 알림

### 이슈 #24: 토지 매각 시 건물 처리 테스트

1. 토지 매입 (예: "서울" 50만원)
2. 해당 토지에 호텔 건설 (30만원)
3. 자산 매각 → 토지 "서울" 선택
4. ✅ 확인: 경고 팝업 "건물이 포함된 상태입니다..."
5. "일괄 매각" 선택
6. ✅ 확인: 입금액 = (50만 × 0.5) + (30만 × 0.5) = 40만원

### 이슈 #27: 은행에서 돈 받기 투표 테스트

1. "은행에서 돈 받기" 버튼 클릭 (UI 용어 변경 확인)
2. 금액 입력 후 요청
3. ✅ 확인: 다른 플레이어들에게 투표 모달 표시
4. 과반수 동의 시 → ✅ 확인: 요청 금액 입금
5. 과반수 거부 시 → ✅ 확인: 거절 알림
6. 60초 미응답 시 → ✅ 확인: 자동 거절 (미응답 = 거절)

### 이슈 #26: 거래 취소 테스트

1. 플레이어 A → B 송금 (10만원)
2. 거래 내역 열기
3. 해당 거래의 "취소" 버튼 클릭
4. ✅ 확인: B에게 취소 요청 알림
5. B가 동의 → ✅ 확인: 양쪽 잔액 복원
6. 거래 내역에 "취소됨" 표시 확인

**은행 거래 취소 테스트**:
1. 플레이어가 은행에 납부 (5만원)
2. 해당 거래 취소 요청
3. ✅ 확인: 즉시 취소 완료 (동의 없이)

**취소 불가 조건 테스트**:
1. A → B 송금 (10만원)
2. B가 다른 거래로 잔액 소진 (10만원 → 0원)
3. A가 취소 요청 시도
4. ✅ 확인: "취소" 버튼 비활성화

### 이슈 #28: 자산명 수정 테스트

1. 토지 매입 시 "푸랑스" (오타) 입력
2. 내 자산 목록 열기
3. "푸랑스" 토지명 클릭
4. ✅ 확인: 수정 팝업 표시
5. "프랑스"로 수정 후 저장
6. ✅ 확인: 자산 목록에 "프랑스" 반영

**빈 이름 검증**:
1. 토지명 수정 팝업에서 이름 삭제
2. 저장 시도
3. ✅ 확인: "토지명을 입력해주세요" 오류

### 투표 타임아웃 통일 테스트

**게임 종료 투표**:
1. 호스트가 게임 종료 투표 시작
2. 60초 대기 (미응답)
3. ✅ 확인: 미응답 플레이어 = 거절로 처리

**사회복지기금 투표**:
1. 복지기금 수령 요청
2. 60초 대기 (미응답)
3. ✅ 확인: 미응답 플레이어 = 거절로 처리

---

## 코드 예시

### 송금 버튼 비활성화 로직

```tsx
// TransactionModal.tsx
<button
  type="button"
  onClick={() => { /* 은행으로 송금 */ }}
  disabled={!amount || !!toId}  // toId 있으면 비활성화
  className="..."
>
  은행으로 송금
</button>
```

### 모달 닫힘 방지

```tsx
// GameEndVotePopup.tsx
<Modal
  isOpen={isOpen}
  onClose={() => {}}  // 닫기 함수 무효화
  closeOnOutsideClick={false}
  closeOnEscape={false}
>
  {/* 투표 UI */}
</Modal>
```

### 타임아웃 처리

```typescript
// vote.service.ts
processVoteTimeout(voteId: string): Vote | null {
  const vote = store.votes.get(voteId);
  if (!vote || vote.status !== 'IN_PROGRESS') return null;

  const room = store.rooms.get(vote.roomId);
  if (!room) return null;

  // 미응답 플레이어 = 거절로 처리
  for (const player of room.players) {
    if (!(player.id in vote.votes)) {
      vote.votes[player.id] = false;  // REJECT
    }
  }

  this.checkVoteOutcome(vote);
  return vote;
}
```

---

## 파일 위치 요약

| 기능 | Backend | Frontend |
|------|---------|----------|
| 송금 버튼 | - | TransactionModal.tsx |
| 투표 취소 동기화 | game.handler.ts, vote.service.ts | GameEndVotePopup.tsx, useGame.ts |
| 건물 일괄 매각 | transaction.service.ts | SellAssetModal.tsx |
| 은행 수령 투표 | vote.service.ts, vote.handler.ts | BankReceiveModal.tsx |
| 거래 취소 | transaction.service.ts, transaction.handler.ts | TransactionHistory.tsx |
| 자산명 수정 | room.service.ts (또는 별도) | PlayerAssetModal.tsx |
| 타입 정의 | - | shared/index.ts |
