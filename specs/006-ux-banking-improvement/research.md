# Research: UX 뱅킹 개선

**Feature**: 006-ux-banking-improvement
**Date**: 2026-01-26

## Research Summary

이 기능은 주로 UI/UX 변경과 타입 확장으로 구성되어 있어 별도의 기술 연구가 필요하지 않습니다. 기존 코드베이스 분석을 통해 구현 방향을 결정했습니다.

---

## Decision 1: BuildingType 타입 정의 방식

**Decision**: Asset 인터페이스에 optional buildingType 필드 추가

**Rationale**:
- 기존 Asset 타입: `type: 'LAND' | 'BUILDING'`
- 새 필드: `buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA'`
- optional로 정의하여 기존 데이터와 하위 호환성 유지
- BUILDING 타입일 때만 사용되며, 미지정 시 기본값 'BUILDING' 적용

**Alternatives Considered**:
1. ❌ Asset 타입 자체를 세분화 (`'LAND' | 'HOTEL' | 'BUILDING' | 'VILLA'`)
   - 기존 데이터 마이그레이션 필요
   - 토지/건물 구분 로직 전체 수정 필요
2. ❌ 별도 BuildingAsset 인터페이스 생성
   - 타입 가드 추가 복잡성
   - 기존 코드 수정 범위 증가

---

## Decision 2: 송금 모달 버튼 분리 구현 방식

**Decision**: 단일 확인 버튼을 2개 버튼으로 교체 (TRANSFER 타입일 때)

**Rationale**:
- 현재 TransactionModal은 단일 "확인" 버튼 사용
- TRANSFER 타입일 때만 2개 버튼으로 분리:
  - "플레이어에게 송금" (파란색, 기존 TRANSFER 로직)
  - "은행으로 송금" (빨간색, PAY_COST로 변환)
- 받는 사람 선택 없이 "은행으로 송금" 클릭 시 toId 생략

**Alternatives Considered**:
1. ❌ 대시보드에 별도 버튼 추가
   - 사용자가 선호한 방식과 다름 (clarification 결과)
2. ❌ 모달 내 탭으로 분리
   - 추가 클릭 필요, UX 복잡

---

## Decision 3: 자산 정보 표시 형식

**Decision**: 개수와 평가액 병기, 0개일 때 간략 표시

**Rationale**:
- 자산 있을 때: `🏞️ 토지: 3개 (30만원)` / `🏢 건물: 2개 (50만원)`
- 자산 없을 때: `🏞️ 0 | 🏢 0` (기존 형식 유지)
- 평가액 계산: `player.assets.filter(a => a.type === 'LAND').reduce((sum, a) => sum + a.value, 0)`

**Alternatives Considered**:
1. ❌ 항상 상세 표시
   - 0개일 때 "(0원)" 표시가 불필요하게 길어짐
2. ❌ 평가액만 표시
   - 개수 정보 손실

---

## Decision 4: 4버튼 그리드 레이아웃

**Decision**: 2x2 그리드 (토지 / 호텔 / 빌딩 / 별장)

**Rationale**:
- 기존 토지/건물 2버튼 → 4버튼 확장
- 모바일 320px 지원을 위해 2열 그리드 유지
- 아이콘+텍스트: 🏞️토지, 🏨호텔, 🏢빌딩, 🏡별장

**Alternatives Considered**:
1. ❌ 1x4 수직 배치
   - 모달 높이 증가, 스크롤 필요 가능성
2. ❌ 4x1 수평 배치
   - 320px 화면에서 버튼이 너무 좁아짐

---

## Decision 5: 색상 구분 체계

**Decision**: 기존 컬러 팔레트 활용

**Rationale**:
- "플레이어에게 송금": `bg-blue-600` (기존 송금하기 버튼 색상)
- "은행으로 송금": `bg-red-600` (비용/납부 의미)
- 토지/건물 매입 버튼: `bg-emerald-600` 유지

**Alternatives Considered**:
1. ❌ 새로운 색상 추가
   - 디자인 일관성 저해
   - Tailwind 커스텀 설정 필요

---

## Implementation Notes

### 영향받는 파일 목록

1. **shared/src/index.ts**
   - Asset 인터페이스에 buildingType 추가
   - ClientToServerEvents tx:request에 buildingType 추가

2. **frontend/src/components/TransactionModal.tsx**
   - 4버튼 그리드 (토지/호텔/빌딩/별장)
   - 송금 모달에 2개 확인 버튼
   - 타이틀 변경 (PAY_COST → "은행에 납부")
   - assetType 상태를 buildingType으로 확장

3. **frontend/src/components/RankingList.tsx**
   - 자산 개수 + 평가액 표시
   - 건물 유형별 아이콘 표시

4. **frontend/src/pages/Dashboard.tsx**
   - 버튼 텍스트: "토지/건물/비용지불" → "토지/건물 매입"

5. **backend/src/handlers/transaction.handler.ts**
   - BUY_ASSET 처리 시 buildingType 저장

### 하위 호환성

- 기존 BUILDING 자산에 buildingType 없음 → 기본값 'BUILDING' 표시
- 기존 tx:request에 buildingType 없음 → assetType만 사용 (기존 동작)
