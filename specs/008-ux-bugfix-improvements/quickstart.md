# Quickstart: UX 버그 수정 및 기능 개선

**Feature**: 008-ux-bugfix-improvements
**Date**: 2026-02-01

## 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- npm 9+

### 설치 및 실행
```bash
# 저장소 클론 (이미 있다면 생략)
git clone <repo-url>
cd blue_bank

# 피처 브랜치로 체크아웃
git checkout 008-ux-bugfix-improvements

# 의존성 설치
npm install

# 개발 서버 실행 (백엔드 + 프론트엔드)
npm run dev
```

### 테스트 실행
```bash
# 전체 테스트
npm test

# 특정 테스트 파일
npm test -- frontend/src/utils/formatMoney.test.ts
```

---

## 주요 변경 파일

### Frontend

| 파일 | 변경 내용 |
|------|----------|
| `src/utils/transactionLabels.ts` | [NEW] 거래 유형 한글 매핑 |
| `src/components/TransactionHistory.tsx` | 한글 라벨, 상세 내역, 스크롤바 |
| `src/components/TransactionModal.tsx` | autoFocus 제거, 토지명 입력, 드롭다운, 별장 갯수 |
| `src/components/BankReceiveModal.tsx` | 플레이어 선택 제거, autoFocus 제거 |
| `src/components/SellAssetModal.tsx` | 표시 양식 변경, 금액 파싱 버그 수정 |
| `src/components/RankingList.tsx` | 클릭 이벤트 추가 |
| `src/components/PlayerAssetModal.tsx` | [NEW] 자산 현황 모달 |
| `src/components/MoneyDisplay.tsx` | 클릭 토글 기능 |
| `src/components/GameEndVotePopup.tsx` | 취소 버튼 추가 |
| `src/hooks/useGame.ts` | 알림 토스트 연동 |
| `src/index.css` | 모던 스크롤바 CSS |

### Backend

| 파일 | 변경 내용 |
|------|----------|
| `src/handlers/transaction.handler.ts` | 은행 수령 권한 완화 |
| `src/handlers/vote.handler.ts` | 투표 취소 핸들러 |
| `src/services/vote.service.ts` | 투표 취소 로직 |

### Shared

| 파일 | 변경 내용 |
|------|----------|
| `src/index.ts` | 투표 취소 이벤트 타입 |

---

## 구현 순서 (권장)

### Phase 1: 기초 유틸리티
1. `transactionLabels.ts` 생성
2. `index.css` 스크롤바 스타일 추가

### Phase 2: 버그 수정 (P1)
3. `SellAssetModal.tsx` 금액 파싱 버그 수정
4. `useGame.ts` 알림 시스템 연동

### Phase 3: UI 개선 (P1)
5. `TransactionHistory.tsx` 한글화 및 상세 내역
6. `BankReceiveModal.tsx` 플레이어 선택 제거
7. `TransactionModal.tsx` 토지/건물 매입 UI 개선
8. `SellAssetModal.tsx` 표시 양식 변경

### Phase 4: 자동 포커스 제거 (P2)
9. `TransactionModal.tsx` autoFocus 제거
10. `BankReceiveModal.tsx` autoFocus 제거 (있는 경우)

### Phase 5: 추가 기능 (P2)
11. `PlayerAssetModal.tsx` 신규 생성
12. `RankingList.tsx` 클릭 이벤트 추가
13. `MoneyDisplay.tsx` 토글 기능
14. 금액 100조 제한 (모든 입력 필드)
15. `GameEndVotePopup.tsx` 취소 버튼

### Phase 6: 백엔드
16. `transaction.handler.ts` 권한 완화
17. `vote.handler.ts` 취소 핸들러
18. `vote.service.ts` 취소 로직
19. `shared/index.ts` 타입 추가

---

## 테스트 체크리스트

### 거래내역
- [ ] 모든 거래 유형이 한글로 표시됨
- [ ] 송금 시 상대방 이름 표시
- [ ] 자산 매입 시 토지명/건물명 표시
- [ ] 스크롤바가 모던하게 표시됨

### 은행 수령
- [ ] 일반 플레이어가 직접 수령 가능
- [ ] 플레이어 선택 드롭다운 없음
- [ ] 본인 계좌로 금액 추가됨

### 알림 시스템
- [ ] 거래 성공 시 토스트 표시
- [ ] 에러 발생 시 토스트 표시
- [ ] 송금 수신 시 알림 표시

### 송금/토지매입 자동포커스
- [ ] 모달 열림 시 금액 입력에 포커스 없음
- [ ] 모바일에서 키보드 자동 올라오지 않음

### 토지/건물 매입
- [ ] 토지 선택 시 토지명 입력 필드 표시
- [ ] 호텔/빌딩/별장 선택 시 보유 토지 드롭다운 표시
- [ ] 별장 선택 시 갯수 버튼 (1개, 2개) 표시
- [ ] 중복 토지명 입력 시 에러 표시

### 자산 매각
- [ ] "서울" + "토지" 형태로 표시
- [ ] "프랑스 빌딩" + "빌딩" 형태로 표시
- [ ] "독일 별장1" + "별장" 형태로 표시
- [ ] 매각 시 금액 정상 처리됨

### 랭킹 자산 조회
- [ ] 플레이어 클릭 시 자산 현황 모달 표시
- [ ] 현금, 토지, 건물 목록 표시

### 금액 표시 토글
- [ ] 상단 현금 클릭 시 만원↔숫자 토글

### 금액 100조 제한
- [ ] 100조 초과 입력 차단
- [ ] 붙여넣기로 100조 초과 입력 차단
- [ ] 에러 토스트 표시

### 게임종료 투표 취소
- [ ] 취소 버튼 표시
- [ ] 클릭 시 투표 취소됨
- [ ] 투표 상태 업데이트됨

---

## 디버깅 팁

### Socket 이벤트 확인
```typescript
// useSocket.ts에서 디버깅
socket.onAny((event, ...args) => {
  console.log('[Socket]', event, args);
});
```

### 토스트 테스트
```typescript
import toast from 'react-hot-toast';
toast.success('테스트 성공!');
toast.error('테스트 에러!');
```

### 금액 변환 테스트
```typescript
import { formatManwon, formatWon } from './utils/formatMoney';
console.log(formatManwon(5860000)); // "586만원"
console.log(formatWon(5860000));    // "5,860,000원"
```

---

## 참고 자료

- [spec.md](./spec.md) - 기능 명세서
- [plan.md](./plan.md) - 구현 계획
- [research.md](./research.md) - 리서치 결과
- [data-model.md](./data-model.md) - 데이터 모델
- [contracts/socket-events.md](./contracts/socket-events.md) - Socket 이벤트 계약
