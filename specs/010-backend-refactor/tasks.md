# Tasks: 백엔드 리팩토링 - 코드 구조 개선 및 메모리/성능 최적화

**Input**: Design documents from `/specs/010-backend-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/socket-events.md, quickstart.md

**Tests**: 스펙에서 명시적 테스트 요청 없음. 테스트 태스크는 포함하지 않음.

**Organization**: User Story 우선순위(P1→P2→P3) 순서로 구성. 단, US-1(코드 중복 제거)과 US-5(타이머 통합)는 모든 후속 작업의 전제 조건이므로 Foundational Phase에 배치.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 User Story (US1~US7)
- 모든 경로는 프로젝트 루트 기준

---

## Phase 1: Setup

**Purpose**: 신규 유틸리티 모듈 생성 (후속 모든 리팩토링의 토대)

- [ ] T001 [P] 백엔드에서 사용하는 모든 매직넘버(60000, 120000, 300000 등)를 추출하여 backend/src/utils/constants.ts에 중앙 상수로 정의 (VOTE_TIMEOUT_MS, CANCEL_REQUEST_TIMEOUT_MS, HOST_MIGRATION_DELAY_MS, SESSION_EXPIRY_MS, ROOM_CLEANUP_DELAY_MS, SESSION_CLEANUP_INTERVAL_MS, KICK_GRACE_PERIOD_MS, INITIAL_CASH 등)
- [ ] T002 [P] getRoomId()와 formatManwon() 공통 함수를 backend/src/utils/helpers.ts에 생성. getRoomId는 초기에는 기존 순회 방식으로 구현하되 Phase 3에서 인덱스 기반으로 전환할 수 있도록 설계
- [ ] T003 [P] TimerManager 클래스를 backend/src/utils/timer-manager.ts에 구현. set(key, callback, delay), clear(key), clearByPrefix(prefix), has(key), clearAll() 메서드 포함. 싱글톤 인스턴스 export. 키 네이밍: `{roomId}:{타이머유형}:{식별자}`

---

## Phase 2: Foundational - 코드 중복 제거 및 타이머 통합 (US-1, US-5)

**Purpose**: 기존 핸들러/서비스의 중복 코드를 공통 모듈로 교체. 모든 후속 User Story의 전제 조건.

**⚠️ CRITICAL**: 이 Phase 완료 전까지 다른 User Story 작업 불가

- [ ] T004 [P] [US1] backend/src/handlers/connection.handler.ts에서 getRoomId() 로컬 정의를 삭제하고 helpers.ts의 getRoomId를 import하여 사용. 매직넘버를 constants.ts 상수로 교체
- [ ] T005 [P] [US1] backend/src/handlers/transaction.handler.ts에서 getRoomId() 로컬 정의를 삭제하고 helpers.ts의 getRoomId를 import하여 사용. 매직넘버(60000 등)를 constants.ts 상수로 교체
- [ ] T006 [P] [US1] backend/src/handlers/vote.handler.ts에서 getRoomId() 로컬 정의를 삭제하고 helpers.ts의 getRoomId를 import하여 사용. 매직넘버를 constants.ts 상수로 교체
- [ ] T007 [P] [US1] backend/src/handlers/game.handler.ts에서 매직넘버를 constants.ts 상수로 교체
- [ ] T008 [P] [US1] backend/src/services/connection.service.ts에서 HOST_MIGRATION_DELAY_MS, GRACE_PERIOD_MS 등 로컬 상수를 삭제하고 constants.ts import로 교체
- [ ] T009 [P] [US1] backend/src/services/notification.service.ts에서 formatManwon 중복 정의가 있으면 helpers.ts import로 교체
- [ ] T010 [US5] backend/src/handlers/vote.handler.ts에서 store.voteTimeouts 기반 타이머를 timerManager.set(`{roomId}:vote:{voteId}`, ...) 패턴으로 전환
- [ ] T011 [US5] backend/src/services/connection.service.ts에서 hostMigrationTimers(모듈 레벨 Map) 기반 타이머를 timerManager.set(`{roomId}:host-migration`, ...) 패턴으로 전환
- [ ] T012 [US5] backend/src/handlers/transaction.handler.ts에서 거래 취소 setTimeout을 timerManager.set(`{roomId}:cancel:{requestId}`, ...) 패턴으로 전환
- [ ] T013 [US5] backend/src/handlers/game.handler.ts에서 게임 종료 투표 setTimeout을 timerManager.set(`{roomId}:vote:{voteId}`, ...) 패턴으로 전환
- [ ] T014 [US5] backend/src/services/vote.service.ts에서 타이머 관련 코드(finalizeVote의 clearTimeout 등)를 timerManager.clear() 패턴으로 전환
- [ ] T015 [US5] backend/src/models/store.ts에서 voteTimeouts Map을 삭제하고, reset() 메서드에서 timerManager.clearAll()을 호출하도록 변경
- [ ] T016 backend/src/app.ts에서 session cleanup setInterval의 매직넘버를 constants.ts의 SESSION_CLEANUP_INTERVAL_MS로 교체

**Checkpoint**: 코드에 getRoomId/formatManwon 중복 0건, 매직넘버 0건, 모든 타이머가 TimerManager를 통해 관리됨. `npm run build` 성공 확인

---

## Phase 3: User Story 2 - 조회 성능 최적화 (Priority: P1)

**Goal**: Store에 보조 인덱스를 추가하여 플레이어-방, 방-거래, 플레이어-알림 조회를 O(1)로 개선

**Independent Test**: 인덱스 추가 전후로 모든 기능이 동일하게 동작하고, 대량 데이터에서 조회 성능 개선 확인

- [ ] T017 [US2] backend/src/models/store.ts에 인덱스 Map 3개 추가: playerToRoom(Map<string, string>), roomTransactions(Map<string, Set<string>>), playerNotifications(Map<string, Set<string>>). reset()에 인덱스 초기화 추가
- [ ] T018 [US2] backend/src/models/store.ts에 인덱스 기반 조회 메서드 추가: getPlayerRoom(playerId), getRoomTransactions(roomId), getPlayerNotifications(playerId)
- [ ] T019 [US2] backend/src/services/room.service.ts에서 방 생성(createRoom) 시 playerToRoom 인덱스에 호스트 등록, 방 참가(joinRoom) 시 playerToRoom 인덱스에 플레이어 등록
- [ ] T020 [US2] backend/src/services/transaction.service.ts에서 거래 생성 시 roomTransactions 인덱스에 거래 ID 추가. getPlayerTransactions()를 인덱스 기반으로 교체
- [ ] T021 [US2] backend/src/services/notification.service.ts에서 알림 생성 시 playerNotifications 인덱스에 알림 ID 추가. getUnreadNotificationCount()를 인덱스 기반으로 교체
- [ ] T022 [US2] backend/src/utils/helpers.ts의 getRoomId()를 store.playerToRoom.get(playerId) 인덱스 기반 O(1) 조회로 전환
- [ ] T023 [US2] backend/src/services/connection.service.ts에서 disconnect 시 playerToRoom 인덱스 유지(OFFLINE), 킥 시 playerToRoom에서 삭제

**Checkpoint**: 모든 조회가 인덱스 기반 O(1). 방 생성/참가/퇴장 시 인덱스 자동 갱신. `npm run build` 성공

---

## Phase 4: User Story 7 - 세션/재접속 흐름 정비 (Priority: P1)

**Goal**: 세션 관리 8건 결함 수정 (LOBBY 재접속, 스냅샷 복원 개선, 유령 정리, dead code 제거)

**Independent Test**: LOBBY/PLAYING/ENDED 모든 상태에서 disconnect→재접속이 정상 동작, 세션 만료 후 유령 0건

- [ ] T024 [US7] backend/src/handlers/room.handler.ts에서 room:join 핸들러에 LOBBY 재접속 분기 추가: joinRoom() 실패 시 "Nickname taken" + 해당 닉네임 플레이어가 OFFLINE이면 connectionService.restoreSession() 호출
- [ ] T025 [US7] backend/src/services/connection.service.ts의 restoreSession()을 스냅샷 기반에서 room.players 실시간 기반으로 변경: room.players에서 nickname으로 기존 OFFLINE 플레이어를 찾아 id를 새 socket.id로 교체, connectionStatus를 ONLINE으로 변경, disconnectedAt을 null로 설정
- [ ] T026 [US7] backend/src/services/connection.service.ts의 restoreSession()에서 playerToRoom 인덱스 갱신 추가: 구 socket.id delete → 새 socket.id set
- [ ] T027 [US7] backend/src/services/connection.service.ts의 cleanupExpiredSessions()에서 세션 만료 시 room.players 동기 제거 로직 추가: LOBBY/ENDED 상태 방에서는 해당 OFFLINE 플레이어를 room.players에서 제거 + playerToRoom 인덱스 삭제. PLAYING 상태에서는 OFFLINE 유지 (호스트 킥 위임)
- [ ] T028 [US7] backend/src/services/connection.service.ts의 cleanupExpiredSessions()에서 LOBBY/ENDED 방의 모든 플레이어가 제거되면 해당 방을 store.rooms에서 삭제 (빈 방 자동 정리)
- [ ] T029 [US7] backend/src/services/connection.service.ts의 migrateHost() 콜백에서 방 존재 여부 확인 추가: store.rooms.has(room.id)가 false이면 타이머 정리 후 조기 반환
- [ ] T030 [US7] backend/src/handlers/connection.handler.ts에서 connection:heartbeat 이벤트 핸들러 제거, room:rejoin 이벤트 핸들러 제거
- [ ] T031 [US7] shared/src/index.ts에서 Player 인터페이스의 lastSeenAt 필드 삭제, ClientToServerEvents에서 'connection:heartbeat'와 'room:rejoin' 이벤트 삭제
- [ ] T032 [US7] backend/src/services/room.service.ts에서 Player 생성 시 lastSeenAt 초기화 코드 삭제 (createRoom, joinRoom 모두)
- [ ] T033 [US7] backend/src/services/connection.service.ts에서 lastSeenAt 관련 코드 전부 삭제 (updateConnectionStatus, restoreSession 등)

**Checkpoint**: LOBBY/PLAYING 재접속 성공, 세션 만료 후 유령 플레이어 0건, dead code(heartbeat, rejoin, lastSeenAt) 완전 제거. `npm run build` 성공

---

## Phase 5: User Story 4 - 비즈니스 로직 서비스 분리 (Priority: P2)

**Goal**: 랭킹 계산 중복 제거, 거래 처리 switch문을 개별 private 메서드로 분리

**Independent Test**: 게임 시작/종료, 랭킹 계산, 모든 거래 타입(8종) 동일 동작 확인

- [ ] T034 [US4] backend/src/services/transaction.service.ts에서 processTransaction()의 switch문 각 case를 8개 private 메서드로 추출: processTransfer, processBuyAsset, processSellAsset, processPayCost, processDonate, processSalary, processWelfareReceive, processBankReceive. processTransaction()은 디스패처 역할만 수행
- [ ] T035 [US4] backend/src/handlers/game.handler.ts에서 랭킹 계산 로직(중복 3곳)을 하나의 서비스 함수로 추출하여 backend/src/services/room.service.ts에 calculateRankings(players) 함수로 이동
- [ ] T036 [US4] backend/src/handlers/game.handler.ts에서 중복된 랭킹 계산 코드 3곳을 모두 서비스의 calculateRankings() 호출로 교체

**Checkpoint**: 거래 처리의 각 타입이 독립 메서드로 분리, 랭킹 계산 중복 0건. `npm run build` 성공

---

## Phase 6: User Story 3 - 메모리 관리 및 데이터 정리 (Priority: P1)

**Goal**: 게임 종료 후 5분 자동 정리, 전원 퇴장 시 즉시 정리, 전원 오프라인+세션 만료 시 자동 정리

**Independent Test**: 게임 100회 생성/종료 후 힙 메모리 초기 대비 10% 미만

- [ ] T037 [US3] backend/src/models/store.ts에 cleanupRoom(roomId) 메서드 구현: 해당 방의 rooms, transactions(roomTransactions 인덱스 활용), votes, gameEndVotes, cancelRequests, notifications(playerNotifications 인덱스 활용), disconnectedSessions에서 관련 데이터 일괄 삭제. playerToRoom/roomTransactions/playerNotifications 인덱스 정리. timerManager.clearByPrefix(`{roomId}:`) 호출
- [ ] T038 [US3] backend/src/handlers/game.handler.ts에서 게임 종료(ENDED 전환) 시 timerManager.set(`{roomId}:cleanup`, () => store.cleanupRoom(roomId), ROOM_CLEANUP_DELAY_MS) 타이머 등록
- [ ] T039 [US3] backend/src/services/connection.service.ts에서 킥 처리(kickPlayer) 후 방에 플레이어가 0명이면 store.cleanupRoom(roomId) 즉시 호출
- [ ] T040 [US3] backend/src/handlers/connection.handler.ts에서 disconnect 처리 후 방에 온라인 플레이어가 0명이고 room.status가 LOBBY/ENDED이면, 모든 disconnectedSessions 만료 시 자동 정리되도록 Phase 4의 cleanupExpiredSessions 로직과 연동 확인
- [ ] T041 [US3] backend/src/services/connection.service.ts의 cleanupExpiredSessions()에서 PLAYING 상태 방에서 모든 플레이어가 OFFLINE이고 세션이 전부 만료되면 store.cleanupRoom(roomId)을 호출하여 방 자동 정리

**Checkpoint**: 게임 종료 후 5분에 방 데이터 완전 삭제, 전원 퇴장 시 즉시 삭제, PLAYING 중 전원 오프라인+세션 만료 시 삭제. `npm run build` 성공

---

## Phase 7: User Story 6 - 타입 안전성 강화 (Priority: P3)

**Goal**: 모든 non-null assertion(!) 제거, early return + 에러 콜백 패턴 적용

**Independent Test**: 코드베이스에서 non-null assertion 0건

- [ ] T042 [P] [US6] backend/src/handlers/connection.handler.ts에서 non-null assertion(!)을 모두 찾아 명시적 null 체크 + early return + 에러 콜백 패턴으로 교체
- [ ] T043 [P] [US6] backend/src/handlers/game.handler.ts에서 non-null assertion(!)을 모두 찾아 명시적 null 체크 + early return + 에러 콜백 패턴으로 교체
- [ ] T044 [P] [US6] backend/src/handlers/room.handler.ts에서 non-null assertion(!)을 모두 찾아 명시적 null 체크 + early return + 에러 콜백 패턴으로 교체
- [ ] T045 [P] [US6] backend/src/handlers/transaction.handler.ts에서 non-null assertion(!)을 모두 찾아 명시적 null 체크 + early return + 에러 콜백 패턴으로 교체
- [ ] T046 [P] [US6] backend/src/handlers/vote.handler.ts에서 non-null assertion(!)을 모두 찾아 명시적 null 체크 + early return + 에러 콜백 패턴으로 교체
- [ ] T047 [P] [US6] backend/src/services/ 디렉토리의 모든 서비스 파일(connection, room, transaction, vote, notification)에서 non-null assertion(!)을 모두 찾아 명시적 null 체크 + early return 패턴으로 교체

**Checkpoint**: `grep -rn '!\.' backend/src/ --include='*.ts'` 에서 non-null assertion 0건. `npm run build` 성공

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 최종 검증, 빌드 확인, 잔여 dead code 정리

- [ ] T048 shared 패키지 빌드 확인: `cd shared && npm run build` 실행하여 타입 변경(lastSeenAt 삭제, 이벤트 삭제)이 컴파일 에러 없이 통과하는지 확인
- [ ] T049 백엔드 빌드 확인: `cd backend && npm run build` 실행하여 전체 변경이 TypeScript 컴파일 에러 없이 통과하는지 확인
- [ ] T050 매직넘버 잔여 검사: backend/src/ 디렉토리에서 60000, 120000, 300000 등 타임아웃 관련 매직넘버가 constants.ts 외에 0건인지 확인
- [ ] T051 getRoomId 중복 검사: backend/src/ 디렉토리에서 getRoomId 로컬 정의가 helpers.ts 외에 0건인지 확인
- [ ] T052 non-null assertion 최종 검사: backend/src/ 디렉토리에서 non-null assertion 연산자(!) 사용이 0건인지 확인 (!=, !== 제외)
- [ ] T053 dead code 최종 검사: backend/src/에서 사용되지 않는 import, 미참조 변수, heartbeat/lastSeenAt/room:rejoin 잔재가 0건인지 확인
- [ ] T054 프론트엔드 빌드 확인: `cd frontend && npm run build` 실행하여 shared 타입 변경이 프론트엔드 빌드에 영향을 주지 않는지 확인

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────> Phase 2: Foundational (US-1, US-5)
                                    │
                                    ├──> Phase 3: US-2 (인덱스)
                                    │        │
                                    │        ├──> Phase 4: US-7 (세션) ──> Phase 6: US-3 (메모리)
                                    │        │
                                    ├──> Phase 5: US-4 (로직 분리) ──────> Phase 6: US-3 (메모리)
                                    │                                          │
                                    │                                          v
                                    └──────────────────────────────────> Phase 7: US-6 (타입)
                                                                              │
                                                                              v
                                                                        Phase 8: Polish
```

### User Story Dependencies

- **US-1** (코드 중복 제거): Phase 2 - 모든 후속 작업의 전제 조건
- **US-5** (타이머 통합): Phase 2 - US-3(메모리)의 전제 조건
- **US-2** (인덱스): Phase 3 - US-7(세션)의 전제 조건 (인덱스 갱신 필요)
- **US-7** (세션 정비): Phase 4 - US-3(메모리)의 전제 조건 (세션 만료 연동)
- **US-4** (로직 분리): Phase 5 - US-1 완료 후 독립 실행 가능
- **US-3** (메모리 관리): Phase 6 - US-2, US-5, US-7 모두 완료 필요
- **US-6** (타입 안전성): Phase 7 - 모든 코드 변경 완료 후 마지막 수행

### Parallel Opportunities

**Phase 2 내부**: T004~T009 (핸들러/서비스별 상수 교체) 병렬 가능
**Phase 4 내부**: T030~T033 (dead code 제거) 병렬 가능
**Phase 5 & Phase 3~4**: Phase 5(US-4)는 Phase 3(US-2) 완료와 무관하므로 Phase 3과 병렬 실행 가능
**Phase 7 내부**: T042~T047 (핸들러/서비스별 null 체크) 전부 병렬 가능

---

## Parallel Example: Phase 2 (Foundational)

```bash
# 핸들러별 상수 교체 (병렬)
Task: "T004 [P] [US1] connection.handler.ts getRoomId 교체"
Task: "T005 [P] [US1] transaction.handler.ts getRoomId 교체"
Task: "T006 [P] [US1] vote.handler.ts getRoomId 교체"
Task: "T007 [P] [US1] game.handler.ts 매직넘버 교체"
Task: "T008 [P] [US1] connection.service.ts 상수 교체"
Task: "T009 [P] [US1] notification.service.ts formatManwon 교체"

# 위 완료 후, 타이머 전환 (순차)
Task: "T010 [US5] vote.handler.ts 타이머 전환"
Task: "T011 [US5] connection.service.ts 타이머 전환"
...
```

---

## Implementation Strategy

### MVP First (Phase 1~3)

1. Phase 1: Setup (신규 유틸리티 3개 생성)
2. Phase 2: Foundational (중복 제거 + 타이머 통합)
3. Phase 3: US-2 (인덱스 추가)
4. **STOP and VALIDATE**: 빌드 성공, 기존 기능 동작 확인

### Incremental Delivery

1. Phase 1~2 → 코드 품질 개선 (중복 0건, 매직넘버 0건)
2. Phase 3 → 성능 개선 (O(1) 조회)
3. Phase 4 → 안정성 개선 (세션 결함 8건 수정)
4. Phase 5 → 유지보수성 개선 (서비스 분리)
5. Phase 6 → 메모리 안정성 (자동 정리)
6. Phase 7~8 → 타입 안전성 + 최종 검증

---

## Notes

- [P] 태스크 = 다른 파일 대상, 의존성 없음
- [Story] 라벨 = 해당 User Story 추적용
- 각 Phase 완료 후 `npm run build` 실행하여 컴파일 확인 필수
- 기존 기능 100% 유지가 최우선 제약 조건
- 프론트엔드 코드 변경 없음 (shared 타입 변경만 해당)
