# Research: 뱅킹 UI 개선 및 기능 확장

**Date**: 2026-01-30
**Feature**: 007-banking-features-v2

## 1. 기존 코드베이스 분석

### 1.1 거래 시스템 현황

**Decision**: 기존 TransactionType 열거형 확장
**Rationale**: 현재 `TRANSFER | BUY_ASSET | PAY_COST | DONATE | SALARY | WELFARE_RECEIVE` 6개 타입 존재. 새로운 `BANK_RECEIVE`, `SELL_ASSET` 타입 추가하여 일관성 유지.
**Alternatives considered**:
- 별도 타입 시스템 도입 → 기존 코드 변경 과다, 타입 안전성 저하
- description 필드로 구분 → 타입 검사 불가, 오류 가능성 증가

### 1.2 금액 버튼 현황

**Decision**: TransactionModal.tsx의 amountButtons 배열 수정
**Rationale**: 현재 `[100000, 50000, 10000]` (10만/5만/1만) 하드코딩. `[50000, 10000, 5000, 1000]` (5만/1만/5천/천원)으로 변경. 복지기금 기부 시 `150000` 버튼 조건부 유지.
**Alternatives considered**:
- 설정 파일로 외부화 → 오버엔지니어링, 런타임 변경 필요 없음
- 컴포넌트 분리 → 현재 구조로 충분히 처리 가능

### 1.3 금액 표시 방식

**Decision**: formatMoney 유틸리티 함수 신규 생성
**Rationale**: 현재 `Intl.NumberFormat('ko-KR')` 직접 사용. 만원 단위 변환 로직 필요 (1500000 → "150만원", 5000 → "0.5만원").
**Alternatives considered**:
- 컴포넌트 내 인라인 변환 → 중복 코드, 일관성 저하
- 기존 MoneyDisplay 컴포넌트 수정 → 컴포넌트 역할 혼합 가능성

### 1.4 알림 시스템

**Decision**: react-hot-toast 기반 확장 + 알림 개수 상태 관리
**Rationale**: 기존에 toast 사용 중. 추가적인 알림 개수 표시를 위해 useGame hook에 unreadNotifications 상태 추가.
**Alternatives considered**:
- 별도 알림 라이브러리 도입 → 의존성 증가, 학습 비용
- 커스텀 알림 시스템 구축 → 오버엔지니어링

### 1.5 투표 시스템 현황

**Decision**: 기존 Vote 타입 확장하여 GameEndVote 지원
**Rationale**: 현재 복지기금 수령용 투표만 존재. `voteType: 'WELFARE' | 'GAME_END'` 필드 추가 또는 별도 GameEndVote 타입 생성.
**Alternatives considered**:
- 별도 vote 타입 생성 → 코드 중복 발생
- 기존 Vote 재사용 → voteType 필드 추가로 구분

## 2. 기술적 결정 사항

### 2.1 자산 매각 로직

**Decision**: transaction.service.ts에 SELL_ASSET 처리 로직 추가
**Rationale**:
- 매각 금액 = 자산 가치 * 0.5 (50%)
- 자산 제거 + 현금 증가를 단일 트랜잭션으로 처리
- 거래 내역에 "자산 매각: [자산명] - [매각금액]" 형식으로 기록

### 2.2 은행 수령 기능

**Decision**: 호스트 전용 UI + BANK_RECEIVE 트랜잭션 타입
**Rationale**:
- 호스트만 실행 가능 (isHost 체크)
- 사유 선택: 사전 정의 목록 (복권, 우승상금, 보너스) + "기타" 직접 입력
- fromId: 'BANK', toId: 선택한 플레이어 ID

### 2.3 게임 종료 투표

**Decision**: game:end_request → game_end_vote:started → 전체 동의 시 game:ended
**Rationale**:
- 기존 game:end는 호스트가 즉시 종료
- 새로운 플로우: 호스트 요청 → 모든 플레이어 투표 → 전원 동의 시 종료
- 60초 타임아웃, 미응답은 동의 처리

### 2.4 거래 내역 저장

**Decision**: Store에 transactions Map 이미 존재, 조회 API 추가
**Rationale**:
- 기존 transactions Map에 모든 거래 저장됨
- 플레이어별 필터링 함수 추가
- Socket.io 이벤트로 조회 결과 전송

## 3. UI/UX 결정 사항

### 3.1 거래 내역 버튼 위치

**Decision**: 대시보드 상단 영역에 "거래 내역" 버튼 추가
**Rationale**: 사용자가 쉽게 접근 가능하며, 기존 UI 흐름을 방해하지 않음

### 3.2 알림 배지 위치

**Decision**: 대시보드 헤더 우측에 알림 아이콘 + 빨간 배지
**Rationale**: 일반적인 모바일 앱 패턴, 사용자 기대에 부합

### 3.3 자산 매각 UI

**Decision**: 별도 모달로 보유 자산 목록 표시, 개별 매각 버튼
**Rationale**:
- 각 자산의 현재 가치와 매각 시 받을 금액(50%) 명확히 표시
- 실수 방지를 위한 확인 단계 포함

## 4. 성능 고려사항

### 4.1 알림 자동 소멸

**Decision**: 4초 후 자동 소멸 (react-hot-toast duration 설정)
**Rationale**: 명세서 확정 사항, toast({ duration: 4000 })로 간단히 구현

### 4.2 거래 내역 로딩

**Decision**: 전체 내역 한 번에 로드, 클라이언트 측 스크롤
**Rationale**: 게임 세션 동안 거래 건수가 제한적 (수십~수백 건), 페이지네이션 불필요
