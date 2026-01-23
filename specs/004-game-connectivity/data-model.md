# Data Model: Game Connectivity

**Feature**: 004-game-connectivity  
**Date**: 2026-01-23

## Entities

### 1. ConnectionStatus (Enum)

플레이어의 연결 상태를 나타내는 열거형

| Value          | Description    |
| -------------- | -------------- |
| `ONLINE`       | 정상 연결 상태 |
| `OFFLINE`      | 연결 끊김 상태 |
| `RECONNECTING` | 재연결 시도 중 |

---

### 2. Player (기존 확장)

기존 Player 엔티티에 연결 관련 필드 추가

| Field                  | Type             | Description                       |
| ---------------------- | ---------------- | --------------------------------- |
| `id`                   | string           | Socket ID (기존)                  |
| `nickname`             | string           | 플레이어 닉네임 (기존)            |
| `isHost`               | boolean          | 호스트 여부 (기존)                |
| `connected`            | boolean          | 연결 상태 (기존)                  |
| `cash`                 | number           | 현금 (기존)                       |
| `assets`               | number           | 부동산 자산 (기존)                |
| **`connectionStatus`** | ConnectionStatus | 연결 상태 (NEW)                   |
| **`lastSeenAt`**       | number           | 마지막 접속 시간 (timestamp, NEW) |
| **`disconnectedAt`**   | number \| null   | 연결 끊긴 시간 (timestamp, NEW)   |

---

### 3. DisconnectedSession (NEW)

연결이 끊긴 플레이어의 세션 정보 (유예 기간 동안 보존)

| Field              | Type   | Description                           |
| ------------------ | ------ | ------------------------------------- |
| `nickname`         | string | 플레이어 닉네임                       |
| `roomId`           | string | 방 ID                                 |
| `cash`             | number | 현금                                  |
| `assets`           | number | 부동산 자산                           |
| `disconnectedAt`   | number | 연결 끊긴 시간                        |
| `expiresAt`        | number | 세션 만료 시간 (disconnectedAt + 5분) |
| `originalSocketId` | string | 원래 Socket ID                        |

---

### 4. Room (기존 확장)

기존 Room 엔티티에 호스트 이전 관련 필드 추가

| Field                      | Type                   | Description                    |
| -------------------------- | ---------------------- | ------------------------------ |
| `id`                       | string                 | 방 ID (기존)                   |
| `hostId`                   | string                 | 호스트 Socket ID (기존)        |
| `players`                  | Player[]               | 플레이어 목록 (기존)           |
| `status`                   | RoomStatus             | 방 상태 (기존)                 |
| `welfareFund`              | number                 | 복지기금 (기존)                |
| **`hostMigrationTimer`**   | NodeJS.Timeout \| null | 호스트 이전 타이머 (NEW)       |
| **`pendingHostMigration`** | boolean                | 호스트 이전 대기 중 여부 (NEW) |

---

## Relationships

```text
Room 1 ──── N Player
  │
  └── 0..N DisconnectedSession (유예 기간 동안 연결)
```

---

## State Transitions

### Player Connection State Machine

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────┐   disconnect   ┌───────────┐         │
│  │  ONLINE  │ ───────────────▶│  OFFLINE  │         │
│  └──────────┘                 └───────────┘         │
│       ▲                             │               │
│       │                             │ reconnect     │
│       │                             ▼               │
│       │                      ┌──────────────┐       │
│       └──────────────────────│ RECONNECTING │       │
│            success           └──────────────┘       │
│                                     │               │
│                                     │ 5min timeout  │
│                                     ▼               │
│                              ┌──────────────┐       │
│                              │   REMOVED    │       │
│                              └──────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Host Migration State Machine

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌────────────┐  host disconnects  ┌─────────────┐  │
│  │   NORMAL   │ ──────────────────▶│  PENDING    │  │
│  └────────────┘                    │  (2분 대기)  │  │
│        ▲                           └─────────────┘  │
│        │                                 │          │
│        │ host reconnects                │ 2분 경과  │
│        │ (타이머 취소)                  ▼          │
│        │                          ┌─────────────┐   │
│        └──────────────────────────│  MIGRATED   │   │
│                                   │ (새 호스트) │   │
│                                   └─────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## Validation Rules

1. **닉네임 고유성**: 같은 방 내에서 닉네임은 고유해야 함 (재접속 제외)
2. **유예 기간**: DisconnectedSession은 5분 후 자동 삭제
3. **호스트 이전**: 호스트 연결 끊김 후 2분 경과 시 자동 이전
4. **강제 퇴장**: 5분 이상 OFFLINE 상태인 플레이어만 대상
5. **재접속 식별**: 닉네임 + 방 코드 조합으로 식별, 닉네임만 일치해도 같은 세션으로 간주하지 않음
