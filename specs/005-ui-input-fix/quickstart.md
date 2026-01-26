# Quickstart: 화면 스크롤 및 입력창 UI 오류 수정

## 개요

이 기능은 3가지 UI 버그를 수정합니다:
1. 상단 네비게이션 바 스크롤 겹침
2. 금액 입력 시 화면 튀는 현상
3. 송금 화면 숫자와 '원' 글자 겹침

## 수정 파일

| 파일 | 수정 내용 |
|------|----------|
| `frontend/src/pages/Dashboard.tsx` | 상단 바 z-index 수정 |
| `frontend/src/components/TransactionModal.tsx` | 금액 입력 UI 수정 |

## 수정 상세

### 1. Dashboard.tsx (Line 112)

**Before**:
```tsx
<nav className="... sticky top-0 z-10">
```

**After**:
```tsx
<nav className="... sticky top-0 z-[1000]">
```

### 2. TransactionModal.tsx

#### 2.1 입력 필드 padding 추가 (Line 192)

**Before**:
```tsx
className="w-full ... px-4 py-4 text-2xl ... text-right"
```

**After**:
```tsx
className="w-full ... px-4 py-4 pr-12 text-2xl ... text-right"
```

#### 2.2 formatInput 함수에 최대 자릿수 제한 추가 (Line 54-58)

**Before**:
```tsx
const formatInput = (val: string) => {
  const num = val.replace(/[^0-9]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('ko-KR');
};
```

**After**:
```tsx
const formatInput = (val: string) => {
  const num = val.replace(/[^0-9]/g, '');
  if (!num) return '';
  // 최대 10자리 제한 (약 100억 원)
  const limited = num.slice(0, 10);
  return parseInt(limited, 10).toLocaleString('ko-KR');
};
```

## 테스트 방법

### 수동 테스트

1. **상단 바 테스트**:
   - 게임 화면(Dashboard)에서 위아래로 스크롤
   - 상단 바가 항상 콘텐츠 위에 표시되는지 확인

2. **금액 입력 테스트**:
   - 거래 모달 열기 (송금, 토지 매입 등)
   - 금액 입력 시 화면이 튀지 않는지 확인
   - 큰 금액(1억 이상) 입력 시 숫자와 '원' 겹침 없는지 확인

3. **최대 자릿수 테스트**:
   - 11자리 이상 입력 시도
   - 10자리에서 멈추는지 확인

### 자동화 테스트

```bash
cd frontend
npm run test
```

## 개발 서버 실행

```bash
# 프론트엔드
cd frontend
npm run dev

# 백엔드 (별도 터미널)
cd backend
npm run dev
```

## 성공 기준

- [ ] SC-001: 스크롤 시 상단 바와 콘텐츠가 겹치는 현상 0% 발생
- [ ] SC-002: 금액 입력 시작 시 화면 점프/튀는 현상 0회 발생
- [ ] SC-003: 최대 자릿수(10자리) 금액 입력 시에도 숫자와 '원' 글자가 겹치지 않음
