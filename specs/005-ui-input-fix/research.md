# Research: 화면 스크롤 및 입력창 UI 오류 수정

**Date**: 2026-01-26
**Feature**: [spec.md](./spec.md)

## Research Tasks

### 1. Tailwind CSS z-index 사용법

**Decision**: Tailwind 임의값 문법 `z-[1000]` 사용

**Rationale**:
- Tailwind 기본 z-index 클래스는 `z-0`부터 `z-50`까지만 제공
- 스펙에서 z-index 1000을 요구하므로 임의값 문법 필요
- `z-[1000]`은 인라인 스타일 없이 Tailwind 방식으로 z-index: 1000 적용

**Alternatives considered**:
- 인라인 스타일 `style={{ zIndex: 1000 }}` - Tailwind 철학에 맞지 않음
- CSS 커스텀 클래스 추가 - 불필요한 복잡성

### 2. 모바일 입력 필드 레이아웃 안정화

**Decision**: 고정 높이(`min-h`) 및 padding-right 활용

**Rationale**:
- 입력값 변경 시 레이아웃 시프트 방지를 위해 입력 필드 크기 고정
- `pr-12` (48px)로 '원' 글자 공간 확보
- `text-right` 정렬로 숫자가 오른쪽에서 왼쪽으로 증가

**Alternatives considered**:
- Flexbox로 입력 필드와 '원' 분리 - 기존 레이아웃 큰 변경 필요
- JavaScript로 동적 크기 계산 - 과도한 복잡성

### 3. 가상 키보드 대응

**Decision**: 기존 모달 레이아웃 유지 (특별 조치 불필요)

**Rationale**:
- `TransactionModal`은 이미 `fixed inset-0` 오버레이 사용
- `items-end` (모바일) 배치로 하단에서 모달 표시
- 키보드가 나타나도 모달이 뷰포트 내에 유지됨
- 테스트 시 문제 발생하면 `visualViewport` API 활용 가능

**Alternatives considered**:
- `visualViewport` API 사용 - 현재 레이아웃으로 충분
- `position: fixed` 대신 `position: sticky` - 모달에 부적합

### 4. 최대 자릿수(10자리) 입력 제한

**Decision**: `formatInput` 함수에서 최대 10자리 제한 추가

**Rationale**:
- 스펙에서 최대 10자리(약 100억 원) 제한 요구
- 입력 포맷팅 단계에서 제한하면 사용자가 즉시 피드백 받음
- 기존 `formatInput` 함수 수정으로 최소 변경

**Alternatives considered**:
- `maxLength` 속성 - 포맷팅된 값(쉼표 포함)이라 정확한 제한 어려움
- 제출 시 검증 - 사용자 경험 저하

---

## Summary

모든 NEEDS CLARIFICATION 항목이 해결됨:
1. z-index: Tailwind 임의값 문법으로 해결
2. 레이아웃 안정화: CSS padding/height 고정으로 해결
3. 가상 키보드: 기존 레이아웃으로 충분
4. 입력 제한: formatInput 함수 수정으로 해결

**Next**: Phase 1 - Design & Contracts (quickstart.md 생성)
