# Data Model: 백엔드 리팩토링

**Feature**: 010-backend-refactor | **Date**: 2026-02-06

## 기존 엔티티 (변경 사항 표시)

### Player

| 필드 | 타입 | 변경 | 설명 |
|------|------|------|------|
| id | string | 유지 | socket.id (재접속 시 교체) |
| nickname | string | 유지 | 플레이어 닉네임 (세션 복원 키) |
| cash | number | 유지 | 현금 |
| assetValue | number | 유지 | 자산 평가액 |
| assets | Asset[] | 유지 | 보유 자산 목록 |
| isHost | boolean | 유지 | 호스트 여부 |
| connected | boolean | 유지 | 연결 상태 |
| connectionStatus | ConnectionStatus | 유지 | 'ONLINE' / 'OFFLINE' / 'RECONNECTING' |
| ~~lastSeenAt~~ | ~~number~~ | **삭제** | dead code - 프론트엔드 미전송, 백엔드 미사용 |
| disconnectedAt | number \| null | 유지 | 연결 끊김 시각 |

### Room

| 필드 | 타입 | 변경 | 설명 |
|------|------|------|------|
| id | string | 유지 | 방 고유 ID |
| status | RoomStatus | 유지 | 'LOBBY' / 'PLAYING' / 'ENDED' |
| players | Player[] | 유지 | 참가 플레이어 목록 |
| hostId | string | 유지 | 호스트 socket.id |
| welfareFund | number | 유지 | 복지기금 |
| pendingHostMigration | boolean | 유지 | 호스트 마이그레이션 진행 중 |

### Store (수정)

| 필드 | 타입 | 변경 | 설명 |
|------|------|------|------|
| rooms | Map\<string, Room\> | 유지 | roomId → Room |
| transactions | Map\<string, Transaction\> | 유지 | txId → Transaction |
| votes | Map\<string, Vote\> | 유지 | voteId → Vote |
| disconnectedSessions | Map\<string, DisconnectedSession\> | 유지 | `{roomId}:{nickname}` → Session |
| notifications | Map\<string, Notification\> | 유지 | notificationId → Notification |
| gameEndVotes | Map\<string, GameEndVote\> | 유지 | voteId → GameEndVote |
| cancelRequests | Map\<string, CancelRequest\> | 유지 | requestId → CancelRequest |
| ~~voteTimeouts~~ | ~~Map\<string, NodeJS.Timeout\>~~ | **삭제** | TimerManager로 대체 |
| playerToRoom | Map\<string, string\> | **신규** | playerId → roomId (인덱스) |
| roomTransactions | Map\<string, Set\<string\>\> | **신규** | roomId → Set\<txId\> (인덱스) |
| playerNotifications | Map\<string, Set\<string\>\> | **신규** | playerId → Set\<notifId\> (인덱스) |

### Store 신규 메서드

| 메서드 | 설명 |
|--------|------|
| `cleanupRoom(roomId: string): void` | 방과 관련된 모든 데이터 일괄 삭제 (거래, 알림, 투표, 세션, 인덱스, 타이머) |
| `getPlayerRoom(playerId: string): string \| undefined` | 인덱스 기반 O(1) 방 조회 |
| `getRoomTransactions(roomId: string): Transaction[]` | 인덱스 기반 방별 거래 조회 |
| `getPlayerNotifications(playerId: string): Notification[]` | 인덱스 기반 플레이어별 알림 조회 |

## 신규 엔티티

### TimerManager

| 필드 | 타입 | 설명 |
|------|------|------|
| timers | Map\<string, NodeJS.Timeout\> | 키 → 타이머 참조 |

| 메서드 | 설명 |
|--------|------|
| `set(key, callback, delay)` | 타이머 등록 (기존 동일 키 자동 해제) |
| `clear(key)` | 특정 타이머 해제 |
| `clearByPrefix(prefix)` | 접두사로 시작하는 모든 타이머 일괄 해제 |
| `has(key)` | 타이머 존재 확인 |
| `clearAll()` | 전체 타이머 해제 |

**키 네이밍 컨벤션**: `{roomId}:{타이머유형}:{식별자}`

| 키 패턴 | 용도 | 대기 시간 |
|---------|------|-----------|
| `{roomId}:vote:{voteId}` | 투표 타임아웃 | 60초 |
| `{roomId}:host-migration` | 호스트 마이그레이션 | 120초 |
| `{roomId}:cancel:{requestId}` | 거래 취소 요청 만료 | 60초 |
| `{roomId}:cleanup` | 게임 종료 후 방 정리 | 300초 |

### 공통 상수 (constants.ts)

| 상수명 | 값 | 설명 |
|--------|-----|------|
| VOTE_TIMEOUT_MS | 60_000 | 투표 대기 시간 |
| CANCEL_REQUEST_TIMEOUT_MS | 60_000 | 거래 취소 요청 만료 |
| HOST_MIGRATION_DELAY_MS | 120_000 | 호스트 마이그레이션 대기 |
| SESSION_EXPIRY_MS | 300_000 | 세션 만료 시간 |
| ROOM_CLEANUP_DELAY_MS | 300_000 | 게임 종료 후 정리 대기 |
| SESSION_CLEANUP_INTERVAL_MS | 60_000 | 세션 정리 주기 |
| KICK_GRACE_PERIOD_MS | 300_000 | 킥 가능 유예 시간 |
| INITIAL_CASH | (현재값) | 초기 지급 현금 |

## 상태 전이 다이어그램

### Room 생명주기 (수정)

```
LOBBY ──[game:start]──> PLAYING ──[game:end 승인]──> ENDED
  │                       │                           │
  │ [전원 퇴장]           │ [전원 오프라인 +            │ [5분 경과]
  │ [전원 OFFLINE +       │  세션 전체 만료]            │ [전원 퇴장]
  │  세션 만료]           │                           │
  └───────┬───────────────┴───────────────────────────┘
          ↓
      [cleanupRoom]
       방 데이터 완전 삭제
```

### 플레이어 연결 상태 (수정)

```
ONLINE ──[disconnect]──> OFFLINE ──[room:join 재접속]──> ONLINE
                           │                              ↑
                           │ [세션 만료 5분]               │
                           │   LOBBY/ENDED: 자동 제거      │
                           │   PLAYING: 유지 (킥 위임)     │
                           │                              │
                           └──[킥]──> 방에서 제거          │
                           └──[재접속 성공]────────────────┘
```

### 세션 복원 흐름 (수정)

```
[프론트엔드 room:join]
     │
     ├─ LOBBY 상태
     │   ├─ 닉네임 중복 없음 → 신규 참가
     │   └─ 닉네임 중복 + 기존 OFFLINE → 세션 복원 (player.id 교체)
     │
     ├─ PLAYING 상태
     │   └─ "Game already started" → 세션 복원 (player.id 교체)
     │
     └─ ENDED 상태
         └─ "Game already started" → 세션 복원 (결과 확인용)
```

## 인덱스 갱신 규칙

| 이벤트 | playerToRoom | roomTransactions | playerNotifications |
|--------|-------------|-----------------|-------------------|
| room:join / room:create | `set(playerId, roomId)` | - | - |
| disconnect | 유지 (OFFLINE) | - | - |
| 재접속 (restore) | `delete(oldId)` + `set(newId, roomId)` | - | - |
| player:kick / 퇴장 | `delete(playerId)` | - | `delete(playerId)` |
| cleanupRoom | 해당 방 플레이어 전체 `delete` | `delete(roomId)` | 해당 플레이어 전체 `delete` |
| tx:request | - | `get(roomId).add(txId)` | - |
| notification 생성 | - | - | `get(playerId).add(notifId)` |
