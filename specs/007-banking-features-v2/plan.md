# Implementation Plan: 뱅킹 UI 개선 및 기능 확장

**Branch**: `007-banking-features-v2` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-banking-features-v2/spec.md`

## Summary

이 기능은 Blue Bank 게임의 UI/UX를 개선하고 새로운 기능을 추가합니다:
1. 금액 입력 버튼 단위 변경 (5만/1만/5천/천원)
2. 자산 현황 만원 단위 표시
3. 개인 거래 내역 조회 기능
4. 알림 시스템 확장
5. 은행 수령 기능 (복권, 우승상금 등)
6. 자산 매각 (반액 대매출) 기능
7. 호스트 게임 종료 시 전체 동의 프로세스

기존 TypeScript + React + Socket.io 기반 모노레포 구조를 유지하며, shared 패키지에 새 타입을 추가하고 backend/frontend 각각에 기능을 구현합니다.

## Technical Context

**Language/Version**: TypeScript 5.x (Backend: 5.9.3, Frontend: 5.3.3)
**Primary Dependencies**:
- Backend: Express 5.2.1, Socket.io 4.8.3, tsx, vitest
- Frontend: React 18.2, Vite 5.1.4, Tailwind CSS 3.4.1, react-hot-toast 2.6.0, socket.io-client 4.7.4
**Storage**: In-memory (Map 기반 Store 클래스)
**Testing**: Vitest (Backend & Frontend)
**Target Platform**: Web (모바일 반응형)
**Project Type**: Web application (frontend + backend monorepo)
**Performance Goals**: 실시간 알림 2초 이내, 거래 처리 즉시
**Constraints**: 기존 Socket.io 이벤트 구조 유지, react-hot-toast 기반 알림 확장
**Scale/Scope**: 소규모 멀티플레이 (방당 최대 2~4명)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

프로젝트에 별도의 Constitution 파일이 설정되지 않았습니다. 기본 원칙 적용:
- [x] 기존 코드 구조 및 패턴 준수
- [x] 타입 안전성 유지 (shared 패키지 활용)
- [x] 실시간 통신 패턴 일관성 (Socket.io 이벤트)
- [x] 테스트 가능한 구조 유지

## Project Structure

### Documentation (this feature)

```text
specs/007-banking-features-v2/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Socket.io events)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
shared/
└── src/
    └── index.ts              # 타입 정의 (Transaction, Asset, Notification 등)

backend/
├── src/
│   ├── models/
│   │   └── store.ts          # 인메모리 저장소 (notifications 추가)
│   ├── services/
│   │   ├── transaction.service.ts  # BANK_RECEIVE, SELL_ASSET 추가
│   │   ├── notification.service.ts # 새 파일: 알림 서비스
│   │   └── vote.service.ts         # 게임 종료 투표 로직 추가
│   └── handlers/
│       ├── transaction.handler.ts  # 새 이벤트 핸들러
│       ├── notification.handler.ts # 새 파일: 알림 핸들러
│       └── game.handler.ts         # 게임 종료 투표 핸들러
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── TransactionModal.tsx    # 금액 버튼 수정
│   │   ├── MoneyDisplay.tsx        # 만원 단위 표시 로직 (또는 새 유틸리티)
│   │   ├── TransactionHistory.tsx  # 새 파일: 거래 내역 모달
│   │   ├── BankReceiveModal.tsx    # 새 파일: 은행 수령 모달 (호스트용)
│   │   ├── SellAssetModal.tsx      # 새 파일: 자산 매각 모달
│   │   ├── NotificationBadge.tsx   # 새 파일: 알림 개수 배지
│   │   └── GameEndVotePopup.tsx    # 새 파일: 게임 종료 투표 팝업
│   ├── hooks/
│   │   └── useGame.ts              # 새 이벤트 및 액션 추가
│   ├── utils/
│   │   └── formatMoney.ts          # 새 파일: 만원 단위 포맷 함수
│   └── pages/
│       └── Dashboard.tsx           # 거래내역 버튼, 알림 배지 추가
└── tests/
```

**Structure Decision**: 기존 모노레포 구조(backend/frontend/shared)를 유지하고, 새 기능에 필요한 컴포넌트와 서비스를 각 폴더에 추가합니다.

## Complexity Tracking

> 본 기능은 기존 구조를 확장하며 복잡도 위반 없음

| 항목 | 상태 |
|------|------|
| 새 프로젝트 추가 | 없음 (기존 3개 워크스페이스 유지) |
| 새 패턴 도입 | 없음 (기존 Socket.io + React 패턴 유지) |
| 외부 의존성 추가 | 없음 (기존 react-hot-toast 활용) |

## Implementation Phases

### Phase 0: Research (완료)
- 기존 코드베이스 분석 완료
- 기술 스택 확인 완료
- 타입 구조 파악 완료

### Phase 1: Design & Contracts
- data-model.md: 새 타입 정의 (BANK_RECEIVE, SELL_ASSET, Notification, GameEndVote)
- contracts/: Socket.io 이벤트 계약 정의
- quickstart.md: 개발 시작 가이드

### Phase 2: Tasks (별도 명령어)
- `/speckit.tasks`로 구체적인 구현 태스크 생성
