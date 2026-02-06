# Research: 백엔드 리팩토링

**Feature**: 010-backend-refactor | **Date**: 2026-02-06

## R1: getRoomId 중복 현황 및 공통화 전략

**Decision**: Store 인덱스 기반 O(1) 조회 함수를 `src/utils/helpers.ts`에 단일 정의

**Rationale**: 현재 getRoomId()가 7곳(TS 4곳, JS 3곳)에 동일 패턴으로 중복 정의되어 있다. 각각 모든 rooms를 순회하며 players에서 socket.id를 찾는 O(n) 로직이다. Phase B에서 playerToRoom 인덱스가 추가되면 이 함수는 `Map.get(playerId)` 한 줄로 대체된다.

**Alternatives considered**:
- 각 핸들러에 인라인으로 유지 → 중복 제거 목표에 위배
- Store 클래스의 메서드로 추가 → Store가 비대해지고 단일 책임 위반
- helpers.ts에 공통 함수로 분리 (선택) → 인덱스 도입 후 O(1) 전환이 자연스러움

## R2: Store 인덱스 설계

**Decision**: Store 클래스 내부에 3개의 보조 인덱스 Map을 추가

**Rationale**: 현재 Store는 7개의 Map으로 구성되어 있고, 모든 조회가 순회 기반이다. 인덱스를 Store 내부에 두면 데이터 변경과 인덱스 갱신이 동일 컨텍스트에서 수행되어 불일치 위험이 최소화된다.

**인덱스 설계**:
- `playerToRoom: Map<string, string>` - playerId → roomId (기존 getRoomId 대체)
- `roomTransactions: Map<string, Set<string>>` - roomId → Set<transactionId>
- `playerNotifications: Map<string, Set<string>>` - playerId → Set<notificationId>

**Alternatives considered**:
- 별도 IndexManager 클래스 → 불필요한 추상화, Store와 강결합 필요
- WeakMap 사용 → 키가 string이므로 WeakMap 사용 불가
- Store 내부 인덱스 (선택) → 가장 단순하고 일관성 보장

## R3: TimerManager 설계

**Decision**: `src/utils/timer-manager.ts`에 독립 클래스로 구현

**Rationale**: 현재 타이머가 6곳에서 각각 다른 방식으로 관리되고 있다. Store.voteTimeouts, hostMigrationTimers(모듈 레벨 Map), 그리고 정리되지 않는 setTimeout 3곳이 있다. 단일 관리자를 통해 키 기반 등록/해제와 접두사 기반 일괄 해제를 지원한다.

**API 설계**:
```typescript
class TimerManager {
  set(key: string, callback: () => void, delay: number): void
  clear(key: string): void
  clearByPrefix(prefix: string): void
  has(key: string): boolean
  clearAll(): void
}
```

**키 네이밍 컨벤션**: `{roomId}:{타이머유형}:{식별자}`
- 투표 타임아웃: `{roomId}:vote:{voteId}`
- 호스트 마이그레이션: `{roomId}:host-migration`
- 거래 취소: `{roomId}:cancel:{requestId}`
- 메모리 정리: `{roomId}:cleanup`

**Alternatives considered**:
- Store 내부에 통합 → Store 책임 범위 초과
- 기존 방식 유지 + 정리만 추가 → 타이머 누수 근본 해결 안 됨
- 독립 유틸리티 클래스 (선택) → 테스트 용이, 재사용 가능

## R4: 세션 복원 전략 (스냅샷 vs 실시간)

**Decision**: restoreSession()에서 room.players의 기존 OFFLINE 플레이어 객체를 직접 재활성화

**Rationale**: 현재 disconnect 시 스냅샷을 저장하고 복원 시 그 스냅샷으로 새 Player를 생성한다. 이 방식은 오프라인 중 수신된 거래(다른 플레이어가 보낸 송금 등)가 반영되지 않는 치명적 결함이 있다.

**개선된 복원 흐름**:
1. room.players에서 nickname으로 기존 OFFLINE 플레이어를 찾는다
2. 해당 플레이어의 `id`를 새 socket.id로 교체한다
3. `connectionStatus`를 'ONLINE'으로, `disconnectedAt`을 null로 변경한다
4. disconnectedSessions에서 해당 세션을 삭제한다
5. 인덱스를 새 socket.id로 갱신한다

**Alternatives considered**:
- 스냅샷 데이터로 복원 (현행) → 거래 유실 문제
- 스냅샷과 실시간 데이터 머지 → 복잡도 증가, 충돌 가능성
- room.players 직접 재활성화 (선택) → 가장 단순하고 데이터 정합성 보장

## R5: LOBBY 재접속 처리

**Decision**: room:join 핸들러에서 닉네임 중복 시 OFFLINE 플레이어 확인 분기 추가

**Rationale**: 현재 `roomService.joinRoom()`은 닉네임 중복을 무조건 거부한다. LOBBY에서 disconnect 후 재접속하면 기존 OFFLINE 플레이어의 닉네임과 충돌하여 "Nickname taken" 오류가 발생한다.

**개선된 흐름**:
1. `roomService.joinRoom()` 실패 시 메시지 확인
2. "Nickname taken" + 해당 닉네임의 기존 플레이어가 OFFLINE 상태이면
3. `connectionService.restoreSession()`을 호출하여 복원
4. 기존 "Game already started" 분기와 동일한 복원 로직 재사용

**Alternatives considered**:
- roomService.joinRoom() 내부에서 OFFLINE 감지 → 서비스 책임 범위 초과
- 별도 rejoin 경로 유지 → dead code 증가
- room:join 핸들러에서 분기 추가 (선택) → 최소 변경, 기존 로직 재사용

## R6: 메모리 정리 메커니즘

**Decision**: Store에 `cleanupRoom(roomId)` 메서드를 추가하고, TimerManager를 통해 스케줄링

**Rationale**: 현재 게임 종료 후 방 데이터가 영구 보존되어 메모리가 누적된다.

**정리 트리거 3가지**:
1. **게임 종료 후 5분**: TimerManager에 `{roomId}:cleanup` 타이머 등록
2. **전원 퇴장 시 즉시**: 마지막 플레이어 퇴장/킥 시 즉시 cleanupRoom 호출
3. **전원 오프라인 + 세션 만료**: cleanupExpiredSessions에서 방의 모든 세션 만료 감지 시

**cleanupRoom(roomId) 정리 대상**:
- `rooms.delete(roomId)`
- `transactions` 중 해당 roomId 관련 항목 (roomTransactions 인덱스 활용)
- `votes`, `gameEndVotes`, `cancelRequests` 중 해당 roomId 관련 항목
- `notifications` 중 해당 방 플레이어의 알림 (playerNotifications 인덱스 활용)
- `disconnectedSessions` 중 해당 roomId 관련 세션
- 인덱스에서 해당 roomId 관련 엔트리 제거
- TimerManager에서 `{roomId}:` 접두사 타이머 일괄 해제

**Alternatives considered**:
- 주기적 폴링으로 만료 방 감지 → 불필요한 CPU 사용
- 각 데이터 타입별 개별 정리 → 누락 위험, 코드 분산
- Store 중앙 정리 메서드 (선택) → 단일 지점에서 완전한 정리 보장

## R7: 거래 처리 메서드 분리 전략

**Decision**: transaction.service.ts 내 switch문을 8개 private 메서드로 분리

**Rationale**: 현재 processTransaction()이 249줄의 단일 switch문으로 8개 거래 타입을 처리한다. 각 case 블록을 독립 메서드로 추출하면 개별적으로 이해/수정/테스트할 수 있다.

**메서드 매핑**:
- `TRANSFER` → `private processTransfer(room, requester, payload)`
- `BUY_ASSET` → `private processBuyAsset(room, requester, payload)`
- `SELL_ASSET` → `private processSellAsset(room, requester, payload)`
- `PAY_COST` → `private processPayCost(room, requester, payload)`
- `DONATE` → `private processDonate(room, requester, payload)`
- `SALARY` → `private processSalary(room, requester, payload)`
- `WELFARE_RECEIVE` → `private processWelfareReceive(room, requester, payload)`
- `BANK_RECEIVE` → `private processBankReceive(room, requester, payload)`

processTransaction()은 switch문에서 해당 메서드를 호출하는 디스패처 역할만 수행한다.

**Alternatives considered**:
- 전략 패턴(별도 클래스) → 과도한 추상화, 8개 클래스 파일 생성
- Map 기반 함수 매핑 → 타입 안전성 저하
- private 메서드 분리 (선택) → 최소 변경, 기존 클래스 구조 유지
