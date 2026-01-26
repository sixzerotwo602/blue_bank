# Implementation Plan: 화면 스크롤 및 입력창 UI 오류 수정

**Branch**: `005-ui-input-fix` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-ui-input-fix/spec.md`

## Summary

3가지 UI 버그 수정: (1) 상단 네비게이션 바 스크롤 시 z-index 문제로 콘텐츠가 겹치는 현상, (2) 금액 입력 시 레이아웃 변경으로 화면이 튀는 현상, (3) 금액과 '원' 글자가 겹치는 현상. CSS 및 React 컴포넌트 수정으로 해결.

## Technical Context

**Language/Version**: TypeScript 5.3
**Primary Dependencies**: React 18.2, Tailwind CSS 3.4, Vite 5.1
**Storage**: N/A (프론트엔드 UI 버그 수정)
**Testing**: Vitest, @testing-library/react
**Target Platform**: 모바일 웹 (최소 320px 너비), 데스크탑
**Project Type**: Web application (frontend/backend)
**Performance Goals**: 60fps 스크롤, 입력 지연 없음
**Constraints**: z-index 1000 (모달보다 낮음), 최소 8px 여백
**Scale/Scope**: 2개 컴포넌트 수정 (Dashboard.tsx, TransactionModal.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution이 템플릿 상태이므로 기본 원칙 적용:
- ✅ 단순성: 기존 코드 최소 수정으로 버그만 해결
- ✅ 테스트: 기존 테스트 프레임워크 활용 가능
- ✅ 문서화: 스펙에 명확한 요구사항 정의됨

## Project Structure

### Documentation (this feature)

```text
specs/005-ui-input-fix/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # N/A (UI only)
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A (no API changes)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── TransactionModal.tsx  # 금액 입력 UI 수정 (FR-002, FR-003)
│   ├── pages/
│   │   └── Dashboard.tsx         # 상단 바 z-index 수정 (FR-001)
│   └── index.css                 # 공통 스타일 (필요시)
└── tests/
    └── components/               # 테스트 추가

backend/
└── (변경 없음)
```

**Structure Decision**: 기존 Web application 구조 유지. 프론트엔드 컴포넌트만 수정.

## Complexity Tracking

해당 없음 - 단순 CSS 및 컴포넌트 수정

---

## Bug Analysis

### Bug 1: 상단 네비게이션 바 스크롤 겹침 (FR-001)

**현재 코드** (`Dashboard.tsx:112`):
```tsx
<nav className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-10">
```

**문제**: `z-10` (z-index: 10)이 너무 낮아 다른 요소와 겹침

**해결**: `z-[1000]`으로 변경 (Tailwind 임의값 문법)

### Bug 2: 금액 입력 시 화면 튀는 현상 (FR-002)

**현재 코드** (`TransactionModal.tsx:186-196`):
```tsx
<input
   type="text"
   inputMode="numeric"
   value={amount}
   onChange={(e) => setAmount(formatInput(e.target.value))}
   placeholder="0"
   className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-2xl font-mono text-white..."
   autoFocus
/>
<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">원</span>
```

**문제**:
1. 입력값이 변경될 때 `formatInput`이 값을 포맷팅하면서 폰트 크기/레이아웃이 갑자기 변경
2. 입력 필드의 너비가 고정되지 않아 값에 따라 레이아웃 시프트 발생

**해결**:
1. 입력 필드에 `min-h` 고정하여 높이 변화 방지
2. 필요시 `text-right` 레이아웃 안정화

### Bug 3: 숫자와 '원' 글자 겹침 (FR-003)

**현재 코드** (`TransactionModal.tsx:195`):
```tsx
<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">원</span>
```

**문제**: `right-4` (16px)가 입력값이 길어지면 숫자와 겹침

**해결**:
1. 입력 필드에 `pr-12` (padding-right: 48px) 추가하여 '원' 공간 확보
2. `right-4` 유지 (48px - 16px = 32px 여백 + 8px 최소 요구사항 충족)

---

## Implementation Tasks Preview

1. **T001**: Dashboard.tsx - 상단 바 z-index 수정 (`z-10` → `z-[1000]`)
2. **T002**: TransactionModal.tsx - 입력 필드 padding-right 추가 (`pr-12`)
3. **T003**: TransactionModal.tsx - 입력 필드 레이아웃 안정화
4. **T004**: 테스트 작성 및 수동 검증
