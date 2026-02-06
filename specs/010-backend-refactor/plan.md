# Implementation Plan: 백엔드 리팩토링 - 코드 구조 개선 및 메모리/성능 최적화

**Branch**: `010-backend-refactor` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-backend-refactor/spec.md`

## Summary

Blue Bank 백엔드를 기존 기능 100% 유지하면서 리팩토링한다. 코드 중복 제거(getRoomId 7곳, 랭킹 계산 3곳), Store 인덱스 추가(O(n)→O(1)), 메모리 자동 정리(게임 종료 후 5분), TimerManager 통합, 거래 처리 switch문 메서드 분리, 세션/재접속 흐름 8건 결함 수정, non-null assertion 제거, dead code(room:rejoin, heartbeat) 정리를 수행한다.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Backend/Shared), TypeScript 5.3.3 (Frontend)
**Primary Dependencies**: Express 5.2.1, Socket.io 4.8.3, cors 2.8.6
**Storage**: In-memory (Map 기반 Store 클래스)
**Testing**: Vitest 4.0.18 (Backend), Vitest 1.3.1 (Frontend)
**Target Platform**: Node.js 서버 (ESM, `"type": "module"`)
**Project Type**: Web (npm workspaces 모노레포: backend, frontend, shared)
**Performance Goals**: 플레이어-방 조회 O(1), 게임 100회 생성/종료 후 힙 메모리 초기 대비 10% 미만
**Constraints**: 기존 Socket.io 이벤트 인터페이스(33 ServerToClient, 26 ClientToServer) 변경 없이 유지. 프론트엔드 코드 수정 최소화
**Scale/Scope**: 백엔드 파일 12개 (handlers 6, services 5, models 1) + shared 타입 + 신규 utils 3개

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution이 기본 템플릿 상태(원칙 미설정)이므로 위반 사항 없음. Gate 통과.

## Project Structure

### Documentation (this feature)

```text
specs/010-backend-refactor/
├── plan.md              # 이 파일
├── spec.md              # 기능 스펙
├── research.md          # Phase 0 리서치
├── data-model.md        # Phase 1 데이터 모델
├── quickstart.md        # Phase 1 빠른 시작 가이드
├── contracts/           # Phase 1 Socket.io 이벤트 계약
│   └── socket-events.md
└── tasks.md             # Phase 2 태스크 (speckit.tasks에서 생성)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                      # Express + Socket.io 초기화
│   ├── index.ts                    # 서버 진입점
│   ├── handlers/                   # Socket.io 이벤트 핸들러 (6개)
│   │   ├── connection.handler.ts   # [수정] heartbeat 제거, rejoin 제거
│   │   ├── game.handler.ts         # [수정] 랭킹 로직 서비스로 이동
│   │   ├── notification.handler.ts
│   │   ├── room.handler.ts         # [수정] LOBBY 재접속 통합
│   │   ├── transaction.handler.ts  # [수정] getRoomId 공통화, 매직넘버 상수화
│   │   └── vote.handler.ts         # [수정] getRoomId 공통화, 타이머 TimerManager화
│   ├── models/
│   │   └── store.ts                # [수정] 인덱스 추가, cleanup 메서드 추가
│   ├── services/
│   │   ├── connection.service.ts   # [수정] 세션 복원 로직 개선, 유령 정리
│   │   ├── notification.service.ts
│   │   ├── room.service.ts         # [수정] LOBBY 재접속 지원
│   │   ├── transaction.service.ts  # [수정] switch → 개별 private 메서드
│   │   └── vote.service.ts
│   └── utils/                      # [신규] 공통 유틸리티
│       ├── constants.ts            # [신규] 타임아웃, 매직넘버 중앙 관리
│       ├── helpers.ts              # [신규] getRoomId, formatManwon 등
│       └── timer-manager.ts        # [신규] 통합 타이머 관리자
└── tests/                          # Vitest 테스트

shared/
└── src/
    └── index.ts                    # [수정] lastSeenAt 제거, room:rejoin 제거

frontend/                           # 변경 최소화 (프론트엔드 수정 불필요)
```

**Structure Decision**: 기존 웹 애플리케이션 구조(backend/frontend/shared) 유지. 백엔드에 `src/utils/` 디렉토리만 신규 추가. 새 서비스 파일 생성 없이 기존 파일 내 리팩토링.

## Complexity Tracking

해당 없음 (Constitution 위반 사항 없음)

## Phase 매핑 (plan.md ↔ tasks.md)

| plan.md Phase | tasks.md Phase | 내용 |
|---------------|---------------|------|
| Phase A | Phase 1 + Phase 2 | Setup + 중복 제거/타이머 통합 |
| Phase B | Phase 3 | Store 인덱스 |
| Phase C | Phase 4 | 세션/재접속 정비 |
| Phase D | Phase 5 | 비즈니스 로직 분리 |
| Phase E | Phase 6 | 메모리 관리 |
| Phase F | Phase 7 + Phase 8 | 타입 안전성 + 최종 검증 |

## Implementation Phases

### Phase A: 기반 구축 (US-1, US-5 일부)

**목표**: 후속 모든 리팩토링의 토대가 되는 공통 모듈 생성

1. `src/utils/constants.ts` 생성 - 모든 매직넘버 중앙화
2. `src/utils/helpers.ts` 생성 - getRoomId, formatManwon 공통화
3. `src/utils/timer-manager.ts` 생성 - TimerManager 클래스
4. 기존 핸들러/서비스에서 중복 함수를 공통 모듈로 교체
5. 기존 타이머 사용을 TimerManager로 전환

**의존성**: 없음 (최우선)

### Phase B: Store 인덱스 및 성능 (US-2)

**목표**: O(n) 조회를 O(1)로 개선

1. Store에 인덱스 Map 추가 (playerToRoom, roomTransactions, playerNotifications)
2. 데이터 변경 시 인덱스 자동 갱신 로직 추가
3. 기존 순회 조회를 인덱스 조회로 교체

**의존성**: Phase A (helpers.ts의 getRoomId가 인덱스를 사용하도록 변경)

### Phase C: 세션/재접속 정비 (US-7)

**목표**: 8건 결함 수정

1. room:join에서 LOBBY 재접속 지원 (닉네임 중복 시 OFFLINE 플레이어 확인)
2. restoreSession()에서 스냅샷 대신 room.players 실시간 데이터 사용
3. cleanupExpiredSessions에서 LOBBY/ENDED 방의 room.players 동기 제거
4. migrateHost() 콜백에 방 유효성 확인 추가
5. room:rejoin 핸들러 제거, heartbeat/lastSeenAt 제거
6. shared/src/index.ts 타입 정의 정리

**의존성**: Phase A (TimerManager), Phase B (인덱스 갱신과 세션 정리 연동)

### Phase D: 비즈니스 로직 분리 (US-4)

**목표**: 서비스 계층 정리

1. 랭킹 계산 로직을 game.handler.ts에서 서비스로 이동 (단일 함수)
2. transaction.service.ts의 switch문을 개별 private 메서드로 분리
3. 게임 시작/종료 로직 서비스 계층 정리

**의존성**: Phase A (상수 모듈 참조)

### Phase E: 메모리 관리 (US-3)

**목표**: 자동 데이터 정리 메커니즘

1. Store에 cleanupRoom(roomId) 메서드 추가
2. 게임 종료 후 5분 타이머 등록 (TimerManager 사용)
3. 전원 퇴장 시 즉시 정리
4. 전원 오프라인 + 세션 만료 시 방 자동 정리

**의존성**: Phase B (인덱스 정리), Phase C (세션 만료 연동), Phase A (TimerManager)

### Phase F: 타입 안전성 및 마무리 (US-6)

**목표**: 방어적 프로그래밍, dead code 정리

1. non-null assertion(!) → 명시적 null 체크 + early return + 에러 콜백
2. 최종 빌드 및 전체 기능 회귀 테스트

**의존성**: Phase A~E 완료 후
