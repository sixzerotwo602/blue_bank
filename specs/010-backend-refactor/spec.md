# Feature Specification: 백엔드 리팩토링 - 코드 구조 개선 및 메모리/성능 최적화

**Feature Branch**: `010-backend-refactor`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Blue Bank 백엔드 리팩토링 - 코드 구조 개선 + 메모리/성능 최적화. Socket.io 기반 실시간 보드게임 뱅킹 앱의 백엔드를 기존 기능 100% 유지하면서 리팩토링합니다."

## Clarifications

### Session 2026-02-06

- Q: 게임 종료 후 데이터 정리 대기 시간(cleanup delay)의 구체적인 값은? → A: 5분 (300초)
- Q: 메모리 증가 허용 임계치(SC-003)의 정량적 기준은? → A: 초기 상태 대비 10% 미만
- Q: 비즈니스 로직 분리 전략(FR-012~014)은? → A: 기존 서비스 파일 내 메서드 분리 (새 파일 생성 없이 transaction.service.ts 내 개별 private 메서드화, 랭킹 로직은 기존 서비스로 이동)
- Q: 공통 유틸리티 및 상수 모듈의 배치 위치는? → A: src/utils/ 디렉토리 생성 (constants.ts, helpers.ts 등)
- Q: non-null assertion 제거 후 null 체크 실패 시 에러 처리 전략은? → A: Early return + 에러 콜백 (null이면 콜백에 에러 메시지 전달 후 즉시 반환)
- Q: 재접속 시 socket.id 변경으로 인한 데이터 정합성 해결 전략은? → A: socket.id 교체만 (최소 변경) - player.id만 새 socket.id로 교체하고, 과거 거래/투표/취소요청의 fromId/toId는 구 ID 유지 (이력 데이터이므로 기능 영향 없음)
- Q: PLAYING 상태에서 세션 만료된 플레이어 처리 전략은? → A: PLAYING 중 유지 + 킥 위임 (PLAYING에서는 OFFLINE 유지하고 호스트 킥에 위임, LOBBY/ENDED에서만 자동 제거)
- Q: room:rejoin dead code 처리 방향은? → A: room:rejoin 제거하고 room:join으로 통합 (프론트엔드 변경 불필요, 백엔드에서 room:join 내 모든 재접속 처리)
- Q: heartbeat/lastSeenAt dead code 처리는? → A: 제거 (프론트엔드에서 heartbeat 미전송, 백엔드에서 lastSeenAt을 판정에 미사용 - 완전한 dead code 확인됨)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 코드 중복 제거 및 공통 유틸리티 추출 (Priority: P1)

개발자가 백엔드 코드를 유지보수할 때, 동일한 로직이 여러 파일에 분산되어 있으면 수정 시 누락이 발생할 수 있다. getRoomId() 함수(4곳 중복: connection/transaction/vote 핸들러 정의 3곳 + game 핸들러 인라인 순회 1곳), formatManwon() 함수, 매직 넘버(60000, 120000 등)를 공통 모듈로 추출하여 단일 소스로 관리한다.

**Why this priority**: 코드 중복은 버그의 직접적인 원인이며, 이후 모든 리팩토링의 기반이 된다. 가장 먼저 해결해야 후속 작업이 안전하게 진행된다.

**Independent Test**: 리팩토링 전후로 모든 Socket.io 이벤트가 동일하게 동작하는지 확인한다. 방 생성, 참가, 거래, 투표, 연결 관리 등 전체 기능이 변경 없이 유지되어야 한다.

**Acceptance Scenarios**:

1. **Given** 플레이어가 방에 접속한 상태, **When** 거래/투표/연결 관련 이벤트가 발생하면, **Then** 방 조회가 공통 함수 한 곳을 통해 수행되며 기존과 동일한 결과를 반환한다
2. **Given** 거래 알림이 생성될 때, **When** 금액 포맷팅이 필요하면, **Then** 공통 유틸리티에서 일관된 형식(만원 단위)으로 변환한다
3. **Given** 타이머가 사용되는 모든 곳(투표 60초, 취소 요청 60초, 호스트 마이그레이션 2분 등), **When** 타임아웃 값이 필요하면, **Then** 공통 상수 모듈에서 참조한다

---

### User Story 2 - 조회 성능 최적화 (Priority: P1)

다수의 플레이어와 방이 동시에 운영될 때, 현재 모든 방을 순회하여 플레이어를 찾는 O(n) 조회가 성능 병목이 될 수 있다. 인덱스를 추가하여 플레이어-방 매핑, 방-거래 매핑, 플레이어-알림 매핑을 O(1)로 개선한다.

**Why this priority**: 성능 문제는 사용자 경험에 직접 영향을 미치며, 인덱스는 메모리 관리(User Story 3)의 전제 조건이다.

**Independent Test**: 인덱스 추가 전후로 동일한 결과를 반환하는지 확인하고, 대량 데이터에서 조회 속도가 개선되는지 측정한다.

**Acceptance Scenarios**:

1. **Given** 100개 방에 각 10명의 플레이어가 있을 때, **When** 특정 플레이어의 방을 조회하면, **Then** 모든 방을 순회하지 않고 즉시 결과를 반환한다
2. **Given** 플레이어가 방에 입장/퇴장할 때, **When** 상태 변경이 발생하면, **Then** 인덱스가 자동으로 갱신된다
3. **Given** 플레이어의 거래 내역을 조회할 때, **When** 해당 방의 거래만 필요하면, **Then** 전체 거래를 순회하지 않고 해당 방의 거래만 조회한다

---

### User Story 3 - 메모리 관리 및 데이터 정리 (Priority: P1)

게임이 종료되거나 방이 삭제된 후에도 관련 데이터(거래 내역, 알림, 투표, 취소 요청 등)가 메모리에 남아 누적되면 서버 안정성이 저하된다. 게임 종료 시 일정 시간 후 관련 데이터를 자동으로 정리하는 메커니즘을 추가한다.

**Why this priority**: 메모리 누수는 서버 장애로 이어질 수 있는 심각한 문제이다. 프로덕션 환경에서 필수적이다.

**Independent Test**: 게임 생성/종료를 반복한 후 메모리 사용량이 안정적으로 유지되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 게임이 종료된 방, **When** 5분(300초)이 경과하면, **Then** 해당 방의 모든 거래, 알림, 투표, 취소 요청, 연결 세션이 메모리에서 제거된다
2. **Given** 방의 모든 플레이어가 퇴장(킥 포함)했을 때, **When** 마지막 플레이어가 떠나면, **Then** 방 데이터가 즉시 정리된다
3. **Given** 메모리 정리가 수행될 때, **When** 관련 타이머가 존재하면, **Then** 타이머도 함께 해제된다

---

### User Story 4 - 비즈니스 로직 서비스 분리 (Priority: P2)

게임 핸들러에 랭킹 계산 로직이 3번 중복되어 있고, 거래 처리 함수가 249줄의 단일 switch 문으로 되어 있다. 비즈니스 로직을 적절한 서비스 계층으로 분리하여 유지보수성과 가독성을 높인다.

**Why this priority**: 기능적 영향은 없지만 향후 기능 추가/수정 시 개발 속도와 안정성에 큰 영향을 미친다.

**Independent Test**: 리팩토링 전후로 게임 시작/종료, 랭킹 계산, 모든 거래 타입(8종)이 동일하게 동작하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 게임 종료 투표가 승인되었을 때, **When** 랭킹 계산이 필요하면, **Then** 서비스 계층의 단일 함수를 통해 수행된다 (3곳 중복 제거)
2. **Given** 새로운 거래 타입을 추가해야 할 때, **When** 거래 처리 로직을 확인하면, **Then** 각 거래 타입이 개별 메서드로 분리되어 독립적으로 이해하고 수정할 수 있다
3. **Given** 게임 시작 요청이 발생하면, **When** 호스트가 시작 버튼을 누르면, **Then** 서비스 계층에서 상태 전환과 초기 자금 설정이 수행된다

---

### User Story 5 - 타이머 통합 관리 (Priority: P2)

투표 타임아웃, 호스트 마이그레이션 타이머, 거래 취소 요청 타이머 등이 각각 다른 방식으로 관리되고 있다. 이를 단일 관리자로 통합하여 타이머 누수를 방지하고 방 삭제 시 일괄 정리를 가능하게 한다.

**Why this priority**: 타이머 누수는 메모리 관리와 연결된 문제이며, 중앙화를 통해 디버깅과 모니터링이 용이해진다.

**Independent Test**: 투표 시작/취소, 호스트 마이그레이션, 거래 취소 요청의 타이머가 정상 작동하고 방 정리 시 모두 해제되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 투표가 시작되었을 때, **When** 60초가 경과하면, **Then** 통합 타이머 관리자를 통해 타임아웃이 처리된다
2. **Given** 동일 키로 타이머가 재설정될 때, **When** 새 타이머가 등록되면, **Then** 기존 타이머가 자동으로 해제된 후 새로 등록된다
3. **Given** 방 데이터가 정리될 때, **When** 해당 방 관련 타이머가 존재하면, **Then** 접두사 기반으로 관련 타이머가 일괄 해제된다

---

### User Story 6 - 타입 안전성 강화 (Priority: P3)

Non-null assertion 연산자(!)를 사용하는 코드가 존재하여 런타임 에러 위험이 있다. 모든 non-null assertion을 명시적인 null 체크로 교체하여 런타임 안정성을 높인다.

**Why this priority**: 기능에는 영향이 없지만 런타임 안정성을 높이는 방어적 프로그래밍이다.

**Independent Test**: 코드베이스에서 non-null assertion이 0건인지 확인하고, null/undefined 입력에 대해 안전하게 처리되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 방 조회 결과가 undefined일 수 있는 상황, **When** 데이터 접근이 필요하면, **Then** 명시적 null 체크 후 안전하게 처리된다
2. **Given** 전체 코드베이스를 검색했을 때, **When** non-null assertion(!)을 찾으면, **Then** 0건이어야 한다

---

### User Story 7 - 세션/재접속 흐름 정비 (Priority: P1)

현재 세션 관리 및 재접속 흐름에 다수의 구조적 결함이 존재한다. socket.id를 플레이어 식별자로 직접 사용하면서 재접속 시 ID가 변경되어 데이터 정합성 문제가 발생하고, 게임 상태(LOBBY/PLAYING/ENDED)별 재접속 처리가 일관되지 않다. 리팩토링 과정에서 이 문제들을 함께 해결한다.

**Why this priority**: 세션 관리 결함은 게임 진행 중 플레이어 경험에 직접 영향을 미치며, 인덱스(US-2)와 메모리 관리(US-3) 설계 시 세션 생명주기를 반드시 고려해야 하므로 P1으로 병렬 진행한다.

**Independent Test**: 각 게임 상태(LOBBY/PLAYING/ENDED)에서 연결 끊김/재접속/킥/호스트 마이그레이션이 정상 동작하고, 재접속 후 플레이어 데이터가 정합성을 유지하는지 확인한다.

**현재 세션 흐름 분석 (As-Is)**:

```
[프론트엔드]                              [백엔드]
1. 최초 접속
   room:create/join ──────────────> Player 생성 (socket.id = player.id)
   localStorage에 nickname 저장      room.players에 추가

2. 연결 끊김
   socket disconnect ─────────────> connectionStatus = 'OFFLINE'
                                     disconnectedSessions에 스냅샷 저장
                                     호스트면 2분 마이그레이션 타이머

3. 재접속 (Socket.IO 자동 재연결)
   새 socket 연결 ────────────────> 새 socket.id 할당
   room:join emit ────────────────> "Game already started" 분기에서만
                                     restoreSession() 호출
                                     기존 player 교체 (새 socket.id)

4. 세션 만료 (5분)
                                     cleanupExpiredSessions (1분 주기)
                                     disconnectedSession 삭제
                                     ※ room.players에는 OFFLINE 유지 (유령)
```

**발견된 결함 (총 8건)**:

1. **LOBBY 상태 재접속 불가 (심각)**: room:join → 닉네임 중복 오류 발생. "Game already started" 분기에서만 restoreSession이 호출되므로 LOBBY 상태의 disconnect 후 재접속이 불가능하다 (`room.handler.ts:28`, `room.service.ts:52-61`)
2. **재접속 시 socket.id 변경으로 데이터 불일치**: 재접속 후 새 socket.id가 할당되지만, 기존 투표 기록(`Vote.votes`의 키), 거래 내역(`fromId`/`toId`), 취소 요청(`requesterId`/`targetId`)은 구 socket.id를 참조하여 연결이 끊어진다
3. **세션 스냅샷과 실시간 상태 불일치**: disconnect 시점의 cash/assets 스냅샷으로 복원하므로, 오프라인 중 다른 플레이어가 보낸 송금이 유실될 수 있다 (`connection.service.ts:52-65`)
4. **세션 만료 후 유령 플레이어 잔류**: disconnectedSessions는 5분 후 삭제되지만 room.players에는 OFFLINE 플레이어가 영구 잔류한다. 재접속 불가 + 자동 정리 없음
5. **room:rejoin 이벤트 미사용 (dead code)**: ClientToServerEvents에 정의되어 있고 백엔드 핸들러도 구현되었으나 프론트엔드에서 호출하지 않는다. room:join을 통한 우회 경로만 사용
6. **호스트 마이그레이션 타이머의 방 유효성 미확인**: migrateHost() 콜백이 room 클로저를 캡처하지만, 2분 내에 방이 삭제되면 유효하지 않은 room에 이벤트를 emit할 수 있다 (`connection.service.ts:164-167`)
7. **모든 플레이어 오프라인 시 호스트리스 방**: migrateHost()에서 온라인 플레이어가 0명이면 호스트 없는 방이 되어 관리 불가 상태에 빠진다
8. **heartbeat의 실질적 미활용**: lastSeenAt만 업데이트하며 세션 만료/킥 판정에 사용되지 않는다. disconnectedAt/expiresAt 기준으로만 판단

**Acceptance Scenarios**:

1. **Given** LOBBY 상태에서 플레이어가 disconnect된 후, **When** 같은 닉네임으로 재접속을 시도하면, **Then** 기존 세션이 복원되어 방에 재참가한다
2. **Given** PLAYING 상태에서 플레이어가 disconnect된 후, **When** 재접속하면, **Then** 오프라인 중 수신된 거래가 반영된 최신 상태로 복원된다 (스냅샷이 아닌 room.players의 실시간 데이터 기준)
3. **Given** 세션 만료(5분) 후, **When** 해당 플레이어가 재접속을 시도하면, **Then** 재접속에 실패하고 room.players에서도 해당 플레이어가 정리된다 (유령 방지)
4. **Given** 호스트 마이그레이션 타이머 실행 시, **When** 해당 방이 이미 삭제되었으면, **Then** 타이머가 안전하게 무시된다 (방 유효성 확인)
5. **Given** 모든 플레이어가 오프라인이고 호스트 마이그레이션이 실패하면, **When** 세션 만료 시간이 경과하면, **Then** 방과 관련 데이터가 자동으로 정리된다

---

### Edge Cases

- 메모리 정리 대기 시간 중에 플레이어가 재접속하면 어떻게 되는가? → 게임 종료 후 정리 타이머가 시작되므로 재접속에는 영향 없음 (재접속은 게임 중에만 의미)
- 인덱스 갱신 중 동시 요청이 발생하면? → 단일 스레드(Node.js) 환경이므로 동시성 문제 없음
- 방 정리 시 진행 중인 타이머가 콜백을 실행하면? → clearTimeout으로 타이머 해제 후 정리하므로 콜백 실행 불가
- 인덱스와 실제 데이터가 불일치하면? → 인덱스 갱신은 데이터 변경과 동일 함수 내에서 수행되어 불일치 방지
- LOBBY에서 disconnect 후 같은 닉네임으로 재접속 시? → 기존 OFFLINE 플레이어를 인식하여 세션을 복원한다 (닉네임 중복 오류 대신 복원 경로 우선)
- 재접속 시 기존 투표/거래 기록의 socket.id 불일치? → player.id만 새 socket.id로 교체하고, 과거 거래/투표/취소요청 이력의 ID는 구 값을 유지한다 (이력 데이터이므로 게임 진행에 영향 없음)
- 동시에 같은 닉네임으로 두 탭에서 접속 시도? → 기존 소켓이 연결된 상태면 restoreSession이 실패하여 이중 접속 방지
- 세션 만료(5분) 후 room.players에 남아있는 OFFLINE 플레이어? → LOBBY/ENDED 상태에서는 세션 만료 시 room.players에서 자동 제거. PLAYING 상태에서는 OFFLINE 유지하고 호스트 킥에 위임 (게임 무결성 보호)

## Requirements *(mandatory)*

### Functional Requirements

**공통 유틸리티 및 상수화**

- **FR-001**: 시스템은 플레이어 ID로 방을 조회하는 공통 함수를 `src/utils/helpers.ts`에서 제공해야 한다
- **FR-002**: 시스템은 금액을 만원 단위로 포맷팅하는 공통 함수를 `src/utils/helpers.ts`에서 제공해야 한다
- **FR-003**: 시스템은 모든 타임아웃 값(투표 시간, 취소 요청 시간, 호스트 이전 대기 시간, 세션 유효 기간 등)을 `src/utils/constants.ts`에서 관리해야 한다

**인덱스 및 성능**

- **FR-004**: 시스템은 플레이어-방 매핑을 유지하여 플레이어 ID로 방을 O(1)에 조회할 수 있어야 한다
- **FR-005**: 시스템은 방-거래 매핑을 유지하여 특정 방의 거래 내역만 효율적으로 조회할 수 있어야 한다
- **FR-006**: 시스템은 플레이어-알림 매핑을 유지하여 특정 플레이어의 알림만 효율적으로 조회할 수 있어야 한다
- **FR-007**: 시스템은 플레이어 입장/퇴장, 거래 생성, 알림 생성 시 관련 인덱스를 자동으로 갱신해야 한다

**메모리 관리**

- **FR-008**: 시스템은 게임 종료 후 5분(300초)이 경과하면 해당 방의 모든 관련 데이터를 자동으로 정리해야 한다
- **FR-009**: 정리 대상 데이터는 거래 내역, 알림, 투표, 게임 종료 투표, 취소 요청, 연결 세션, 인덱스를 포함해야 한다
- **FR-010**: 방의 모든 플레이어가 퇴장하면 방 데이터를 즉시 정리해야 한다
- **FR-011**: 데이터 정리 시 해당 방에 연결된 모든 타이머를 함께 해제해야 한다

**비즈니스 로직 분리**

- **FR-012**: 랭킹 계산 로직은 기존 서비스 파일 내 단일 함수로 통합되어야 한다 (game.handler.ts의 중복 로직을 서비스로 이동)
- ~~**FR-013**~~: (스코프 제외) 게임 시작/종료 로직의 서비스 이동은 이번 리팩토링 범위에 포함하지 않는다. 랭킹 계산 통합(FR-012)과 거래 분리(FR-014)에 집중한다
- **FR-014**: 거래 처리의 각 타입(송금, 자산 매입, 매각, 납부, 기부, 월급, 복지기금 수령, 은행 수령)은 transaction.service.ts 내 개별 private 메서드로 분리되어야 한다 (새 파일 생성 없음)

**타이머 관리**

- **FR-015**: 시스템은 모든 타이머를 단일 관리자를 통해 등록/해제해야 한다
- **FR-016**: 동일 키로 타이머 재등록 시 기존 타이머를 자동으로 해제해야 한다
- **FR-017**: 접두사 기반으로 관련 타이머를 일괄 해제할 수 있어야 한다

**세션/재접속 정비**

- **FR-021**: LOBBY 상태에서 disconnect 후 같은 닉네임으로 room:join 시, 닉네임 중복 오류 대신 기존 세션을 복원해야 한다
- **FR-022**: restoreSession() 시 disconnect 시점의 스냅샷이 아닌 room.players의 실시간 데이터를 기준으로 플레이어 상태를 복원해야 한다 (오프라인 중 수신된 거래 반영)
- **FR-023**: 세션 만료(5분) 시 disconnectedSessions 삭제와 동시에 room.players에서도 해당 OFFLINE 플레이어를 제거해야 한다. 단, PLAYING 상태인 방에서는 OFFLINE 플레이어를 유지하고 호스트 킥에 위임한다. LOBBY/ENDED 상태에서만 자동 제거한다
- **FR-024**: 호스트 마이그레이션 타이머 콜백 실행 시 방 존재 여부를 확인하고, 삭제된 방이면 안전하게 무시해야 한다
- **FR-025**: 모든 플레이어가 오프라인이고 세션이 모두 만료되면 방과 관련 데이터를 자동으로 정리해야 한다
- **FR-026**: room:rejoin 이벤트 핸들러를 제거하고, room:join 내에서 LOBBY/PLAYING 모든 상태의 재접속을 통합 처리해야 한다 (프론트엔드 변경 불필요)
- **FR-027**: connection:heartbeat 핸들러와 Player.lastSeenAt 필드를 제거해야 한다 (프론트엔드 미전송, 백엔드 미사용 dead code)

**타입 안전성**

- **FR-018**: 코드베이스에서 모든 non-null assertion 연산자(!)를 명시적 null 체크로 교체해야 한다. null 체크 실패 시 early return과 에러 콜백 패턴을 사용한다 (콜백에 에러 메시지 전달 후 즉시 반환)

**기능 호환성**

- **FR-019**: 리팩토링 후 모든 Socket.io 이벤트 인터페이스(ClientToServerEvents, ServerToClientEvents)는 기능상 변경 없이 유지되어야 한다. 단, dead code로 확인된 이벤트(connection:heartbeat, room:rejoin) 제거와 미사용 필드(lastSeenAt) 삭제는 예외로 한다
- **FR-020**: 리팩토링 후 모든 기존 기능(방 관리, 거래 8종, 투표 3종, 연결 관리, 알림 시스템)이 동일하게 동작해야 한다

### Key Entities

- **Store 인덱스**: 플레이어-방 매핑, 방-거래 매핑, 플레이어-알림 매핑. 기존 데이터 변경 시 자동 갱신되는 보조 인덱스
- **TimerManager**: 타이머 키-참조 매핑. 키 기반 등록/해제, 접두사 기반 일괄 해제 지원
- **GameService**: 랭킹 계산, 게임 시작/종료 로직을 캡슐화한 서비스 엔티티
- **DisconnectedSession**: 닉네임 기반 세션 식별(`{roomId}:{nickname}` 키). 복원 시 스냅샷 대신 room.players의 실시간 데이터를 사용. 만료 시 room.players에서도 동기 제거
- **공통 상수/유틸리티**: `src/utils/constants.ts`에서 모든 타임아웃 값·사유 레이블을, `src/utils/helpers.ts`에서 공통 헬퍼 함수(getRoomId, formatManwon 등)를 중앙 관리

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 리팩토링 후 모든 기존 기능(방 생성/참가, 게임 시작/종료, 거래 8종, 투표 3종, 연결 관리, 알림)이 동일하게 동작한다
- **SC-002**: 플레이어-방 조회가 방 수에 관계없이 일정한 시간 내에 완료된다 (기존 대비 선형 → 상수 시간)
- **SC-003**: 게임 100회 생성/종료 후 서버 힙 메모리 사용량이 초기 상태 대비 10% 미만으로 유지된다
- **SC-004**: 코드베이스에서 동일 로직의 중복 구현이 0건이다 (getRoomId, 랭킹 계산 등)
- **SC-005**: 거래 처리 로직의 각 타입이 독립된 메서드로 분리되어 개별적으로 이해 가능하다
- **SC-006**: 코드베이스에서 non-null assertion 연산자(!) 사용이 0건이다
- **SC-007**: 모든 타임아웃 값이 중앙 상수 모듈에서 관리되며 매직 넘버가 0건이다
- **SC-008**: LOBBY/PLAYING 모든 상태에서 disconnect → 재접속 시 플레이어 데이터가 정합성을 유지한다 (오프라인 중 수신 거래 포함)
- **SC-009**: 세션 만료 후 room.players에 OFFLINE 상태로 잔류하는 유령 플레이어가 0건이다
- **SC-010**: 호스트 마이그레이션 타이머가 삭제된 방에 대해 실행되는 경우가 0건이다
