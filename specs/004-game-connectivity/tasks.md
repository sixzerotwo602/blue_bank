# 태스크: 게임 연결성 (Game Connectivity)

**입력**: `/specs/004-game-connectivity/` 디렉토리의 설계 문서
**필수 조건**: plan.md, spec.md, data-model.md, contracts/socket-events.md, quickstart.md

**테스트**: 명시적으로 요청되지 않음 - 테스트 태스크 생략

**구성**: 태스크는 사용자 스토리별로 그룹화됨 (spec.md의 5개 스토리)

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

---

## Phase 1: 셋업 (공유 인프라) ✅

**목적**: 연결 관련 타입을 shared 패키지에 추가

- [x] T001 shared/src/index.ts에 ConnectionStatus 타입 추가
- [x] T002 [P] shared/src/index.ts에 ConnectionStatusPayload 타입 추가
- [x] T003 [P] shared/src/index.ts에 HostMigratingPayload, HostMigratedPayload 타입 추가
- [x] T004 [P] shared/src/index.ts에 PlayerKickedPayload 타입 추가
- [x] T005 shared/src/index.ts의 ClientToServerEvents에 connection:heartbeat, room:rejoin, player:kick 이벤트 추가
- [x] T006 shared/src/index.ts의 ServerToClientEvents에 connection:status, host:migrating, host:migrated, host:migration_cancelled, player:kicked, player:rejoined 이벤트 추가
- [x] T007 shared/ 폴더에서 npm run build 실행하여 타입 컴파일

---

## Phase 2: 기반 구축 (필수 전제 조건) ✅

**목적**: 연결 관리를 위한 백엔드 인프라

- [x] T008 shared/src/index.ts의 Player 인터페이스에 connectionStatus, lastSeenAt, disconnectedAt 필드 추가
- [x] T009 shared/src/index.ts에 DisconnectedSession 인터페이스 추가
- [x] T010 backend/src/services/connection.service.ts에 빈 서비스 파일 생성
- [x] T011 backend/src/handlers/connection.handler.ts에 빈 핸들러 파일 생성
- [x] T012 backend/src/app.ts에 connection 핸들러 등록
- [x] T013 backend/src/models/store.ts에 disconnectedSessions Map 추가
- [x] T014 shared/에서 npm run build 실행하여 타입 재컴파일

**체크포인트**: 기반 준비 완료 ✅

---

## Phase 3: 사용자 스토리 1 - 연결 상태 실시간 표시 (우선순위: P1) 🎯 MVP ✅

**목표**: 각 플레이어의 연결 상태(온라인/오프라인/재연결 중)를 실시간으로 표시

### 사용자 스토리 1 구현

- [x] T015 [US1] backend/src/services/connection.service.ts에 updateConnectionStatus 메서드 구현
- [x] T016 [US1] backend/src/handlers/connection.handler.ts에 disconnect 이벤트 핸들러 추가하여 connection:status 이벤트 emit
- [x] T017 [US1] backend/src/handlers/connection.handler.ts에 connect 이벤트 핸들러 추가하여 ONLINE 상태 설정
- [x] T018 [US1] backend/src/services/room.service.ts에서 플레이어 입장 시 connectionStatus: 'ONLINE', lastSeenAt 초기화
- [x] T019 [P] [US1] frontend/src/components/ConnectionStatus.tsx 컴포넌트 생성
- [x] T020 [US1] frontend/src/hooks/useGame.ts에 connection:status 이벤트 리스너 추가
- [x] T021 [US1] frontend/src/pages/Lobby.tsx의 플레이어 목록에 ConnectionStatus 컴포넌트 표시
- [x] T022 [US1] frontend/src/pages/Dashboard.tsx의 플레이어 목록에 ConnectionStatus 컴포넌트 표시

**체크포인트**: 사용자 스토리 1 완료 ✅

---

## Phase 4: 사용자 스토리 2 - 재접속 및 세션 복원 (우선순위: P1) ✅

**목표**: 5분 유예 기간 내 닉네임+방코드로 재접속 시 세션(현금/자산) 복원

### 사용자 스토리 2 구현

- [x] T023 [US2] backend/src/services/connection.service.ts에 saveDisconnectedSession 메서드 구현
- [x] T024 [US2] backend/src/services/connection.service.ts에 findDisconnectedSession 메서드 구현
- [x] T025 [US2] backend/src/services/connection.service.ts에 restoreSession 메서드 구현
- [x] T026 [US2] backend/src/services/connection.service.ts에 cleanupExpiredSessions 메서드 구현 (5분 만료)
- [x] T027 [US2] backend/src/handlers/connection.handler.ts의 disconnect 이벤트에서 세션 저장
- [x] T028 [US2] backend/src/handlers/connection.handler.ts에 room:rejoin 핸들러 구현
- [x] T029 [US2] backend/src/app.ts에 세션 만료 타이머 추가 (setInterval로 정리)
- [x] T030 [P] [US2] frontend/src/hooks/useSocket.ts에 room:rejoin 호출 로직 추가
- [x] T031 [US2] frontend/src/hooks/useGame.ts에 player:rejoined 이벤트 처리
- [x] T032 [US2] frontend/src/hooks/useGame.ts에 "플레이어 재연결 중..." 토스트 알림 표시

**체크포인트**: 사용자 스토리 2 완료 ✅

---

## Phase 5: 사용자 스토리 3 - 호스트 이전 (우선순위: P2) ✅

**목표**: 호스트 연결 끊김 후 2분 대기 후 입장 순서 기반 자동 호스트 이전

### 사용자 스토리 3 구현

- [x] T033 [US3] shared/src/index.ts의 Room 인터페이스에 hostMigrationTimer 필드 추가
- [x] T034 [US3] backend/src/services/connection.service.ts에 startHostMigrationTimer 메서드 구현
- [x] T035 [US3] backend/src/services/connection.service.ts에 cancelHostMigrationTimer 메서드 구현
- [x] T036 [US3] backend/src/services/connection.service.ts에 migrateHost 메서드 구현 (입장 순서 기반)
- [x] T037 [US3] backend/src/handlers/connection.handler.ts에서 호스트 disconnect 시 이전 타이머 시작
- [x] T038 [US3] backend/src/handlers/connection.handler.ts에서 호스트 rejoin 시 타이머 취소
- [x] T039 [US3] backend/src/handlers/connection.handler.ts에서 host:migrating, host:migrated, host:migration_cancelled 이벤트 emit
- [x] T040 [US3] frontend/src/hooks/useGame.ts에 host:migrating 이벤트 처리
- [x] T041 [US3] frontend/src/hooks/useGame.ts에 host:migrated 이벤트 처리 (room 상태 업데이트)
- [x] T042 [US3] frontend/src/hooks/useGame.ts에 host:migration_cancelled 이벤트 처리
- [x] T043 [US3] frontend/src/pages/Dashboard.tsx에 호스트 이전 토스트 알림 표시

**체크포인트**: 사용자 스토리 3 완료 ✅

---

## Phase 6: 사용자 스토리 4 - 플레이어 강제 퇴장 (우선순위: P3) ✅

**목표**: 호스트가 5분 이상 오프라인 플레이어를 강제 퇴장 (자산 말소)

### 사용자 스토리 4 구현

- [x] T044 [US4] backend/src/services/connection.service.ts에 kickPlayer 메서드 구현 (자산 말소 포함)
- [x] T045 [US4] backend/src/services/connection.service.ts에 isKickable 메서드 구현 (5분 오프라인 체크)
- [x] T046 [US4] backend/src/handlers/connection.handler.ts에 player:kick 핸들러 구현
- [x] T047 [US4] backend/src/handlers/connection.handler.ts에서 player:kicked 이벤트를 모든 방 플레이어에게 emit
- [x] T048 [P] [US4] frontend/src/components/KickPlayerButton.tsx 컴포넌트 생성
- [x] T049 [US4] frontend/src/hooks/useGame.ts에 player:kick 호출 함수 추가
- [x] T050 [US4] frontend/src/hooks/useGame.ts에 player:kicked 이벤트 처리
- [x] T051 [US4] frontend/src/pages/Dashboard.tsx에 호스트용 KickPlayerButton 표시 (5분 오프라인 조건)
- [x] T052 [US4] frontend/src/pages/Dashboard.tsx에 퇴장 확인 ConfirmModal 추가

**체크포인트**: 사용자 스토리 4 완료 ✅

---

## Phase 7: 사용자 스토리 5 - 자동 재연결 (우선순위: P3) ✅

**목표**: 연결 끊김 시 자동 재연결 시도 (최대 5회, 지수 백오프) 및 진행 UI 표시

### 사용자 스토리 5 구현

- [x] T053 [US5] frontend/src/services/socketContext.tsx에 Socket.IO 재연결 옵션 설정
- [x] T054 [P] [US5] frontend/src/components/ReconnectOverlay.tsx 컴포넌트 생성
- [x] T055 [US5] frontend/src/services/socketContext.tsx에 reconnect_attempt 이벤트 리스너 추가
- [x] T056 [US5] frontend/src/services/socketContext.tsx에 reconnect 이벤트 리스너 추가
- [x] T057 [US5] frontend/src/services/socketContext.tsx에 reconnect_failed 이벤트 리스너 추가
- [x] T058 [US5] frontend/src/services/socketContext.tsx에 재연결 상태 추적 (시도 횟수, 상태)
- [x] T059 [US5] frontend/src/App.tsx에 연결 끊김 시 ReconnectOverlay 표시
- [x] T060 [US5] frontend/src/hooks/useSocket.ts에서 재연결 성공 시 room:rejoin 호출

**체크포인트**: 사용자 스토리 5 완료 ✅

---

## Phase 8: 마무리 및 전체 개선

**목적**: 여러 사용자 스토리에 영향을 미치는 개선 사항

- [ ] T061 [P] specs/004-game-connectivity/spec.md의 상태를 구현됨으로 업데이트
- [ ] T062 specs/004-game-connectivity/quickstart.md의 테스트 시나리오 실행
- [x] T063 [P] frontend/src/hooks/useGame.ts에서 사용하지 않는 playFanfare import 제거
- [ ] T064 backend/src/handlers/의 console.log 문 정리
- [ ] T065 shared/에서 npm run build로 타입 재빌드

---

## 완료 요약

| 항목                | 완료      |
| ------------------- | --------- |
| Phase 1 (셋업)      | ✅ 7/7    |
| Phase 2 (기반 구축) | ✅ 7/7    |
| 사용자 스토리 1     | ✅ 8/8    |
| 사용자 스토리 2     | ✅ 10/10  |
| 사용자 스토리 3     | ✅ 11/11  |
| 사용자 스토리 4     | ✅ 9/9    |
| 사용자 스토리 5     | ✅ 8/8    |
| Phase 8 (마무리)    | 1/5       |
| **총 완료**         | **61/65** |
