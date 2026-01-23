# 구현 계획: 게임 정산 (Game Settlement)

**브랜치**: `003-game-settlement` | **날짜**: 2026-01-23 | **명세**: [spec.md](./spec.md)
**입력**: `/specs/003-game-settlement/spec.md`의 기능 명세

## 개요

호스트가 "게임 종료"를 트리거하면, 서버가 총 자산(현금 + 부동산)을 기준으로 최종 순위를 계산하고, 클라이언트가 상세 정산 오버레이를 표시하는 게임 종료 흐름을 구현합니다.

## 기술적 맥락

**언어/버전**: TypeScript 5.x, Node.js 20+
**주요 종속성**: Socket.IO, React, TailwindCSS
**저장소**: 인메모리 Map (Store 클래스)
**테스트**: 수동 검증 (MVP)
**타겟 플랫폼**: 웹 (데스크탑/모바일)
**프로젝트 유형**: 웹 애플리케이션 (프론트엔드 + 백엔드)
**성능 목표**: 모달 열기/닫기 즉시 반응 (<200ms).
**제약 사항**: 인메모리 상태만 사용.
**규모/범위**: 방당 10명 미만 플레이어.

## 헌법(Constitution) 점검

_GATE: Phase 0 연구 전 통과 필수. Phase 1 설계 후 재확인._

- **KISS**: `ConfirmModal` 재사용. 정산을 위한 단순한 단방향 흐름.
- **DRY**: `ConfirmModal` 재사용. `Player` 및 `Transaction` 타입 공유.
- **SoC**: 백엔드가 순위 계산; 프론트엔드가 표시.
- **SRP**: `SettlementModal`은 결과 표시 역할에만 집중.

## 프로젝트 구조

### 문서 (이 기능)

```text
specs/003-game-settlement/
├── plan.md              # 이 파일
├── research.md          # Phase 0 결과물
├── data-model.md        # Phase 1 결과물
├── quickstart.md        # Phase 1 결과물
├── contracts/           # Phase 1 결과물
└── tasks.md             # Phase 2 결과물
```

### 소스 코드 (루트)

```text
backend/
├── src/
│   ├── handlers/game.handler.ts  # game:end 리스너 추가
│   ├── services/game.service.ts  # endGame 로직 추가
│   └── models/room.ts            # Room status 타입 업데이트
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── ConfirmModal.tsx      # 재사용
│   │   └── SettlementModal.tsx   # 신규: 결과 화면
│   ├── pages/
│   │   └── Dashboard.tsx         # 게임 종료 버튼 추가
│   └── hooks/useGame.ts          # game:ended 이벤트 처리
└── tests/
```

**구조 결정**: 프론트엔드와 백엔드가 분리된 표준 "웹 애플리케이션" 구조.

## 복잡성 추적

위반 사항 없음.
