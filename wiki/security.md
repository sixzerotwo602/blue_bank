# 보안 패턴

> 서버 측 보안 체계. 입력 검증, Rate Limiting, 권한 체계, CORS 전략을 정리한다.

---

## 서버 측 연산 원칙

모든 금액 연산은 **서버에서만** 수행된다. 클라이언트는 거래를 "요청"할 뿐, 실제 잔액 변경은 서버가 검증 후 처리한다.

```
Client: "A가 B에게 10만원 송금 요청"
  ↓
Server: A 잔액 확인 → 차감 → B 잔액 증가 → room:sync broadcast
```

---

## Zod 입력 검증

> 참조: [`backend/src/utils/validation.ts`](../backend/src/utils/validation.ts)

모든 소켓 이벤트 payload는 `validate()` 함수로 Zod 스키마 검증을 거친다.

### 공통 스키마

| 스키마 | 검증 규칙 |
|--------|----------|
| `safeAmount` | 정수, 0 이상, MAX_AMOUNT(10억) 이하, `Number.isFinite` |
| `positiveAmount` | 정수, 1 이상, MAX_AMOUNT 이하 |
| `nickname` | 1~20자, 공백 trim |
| `roomId` | 정확히 6자, `[A-Z0-9]{6}` 정규식 |
| `uuid` | 비어있지 않은 문자열 |
| `transactionType` | 8개 거래 유형 enum |
| `bankReceiveReason` | 4개 사유 enum |

### 이벤트별 스키마

검증 대상 이벤트 15개:

```
room:create, room:join, room:get, game:start,
tx:request, vote:cast, vote:request_bank_receive,
game_end_vote:cast, game_end_vote:cancel,
asset:rename, tx:request_cancel, tx:respond_cancel,
player:kick, notification:mark_read
```

### 사용 패턴

```typescript
// 핸들러에서의 사용
const data = validate<{ roomId: string; nickname: string }>('room:join', { roomId, nickname });
```

검증 실패 시 `ZodError`가 throw되어 핸들러의 try-catch에서 처리된다.

---

## Rate Limiting

> 참조: [`backend/src/utils/rate-limiter.ts`](../backend/src/utils/rate-limiter.ts)

**Fixed-window** 방식의 Rate Limiter. 5개 유형별로 제한값이 다르다.

### 제한 유형별 설정

| 유형 | 최대 요청 수 | 윈도우 | 적용 대상 |
|------|------------|--------|----------|
| `ROOM_CREATE` | 5회 | 5분 | IP 기반 — 방 생성 |
| `ROOM_JOIN` | 20회 | 1분 | IP 기반 — 방 입장 |
| `TRANSACTION` | 60회 | 1분 | 소켓 ID — 거래 요청, 취소 |
| `VOTE` | 30회 | 1분 | 소켓 ID — 투표 관련 |
| `GENERAL` | 100회 | 1분 | 소켓 ID — 기타 (킥, 게임 시작 등) |

### 식별자 기준

- **IP 기반** (`getClientIp()`): `room:create`, `room:join` — Cloudflare Tunnel 경유 시 `cf-connecting-ip` 헤더 사용
- **소켓 ID 기반** (`socket.id`): 그 외 모든 이벤트

### 초과 시 동작

Rate Limit 초과 시 에러 콜백/emit으로 응답하고 요청을 무시한다:

```typescript
if (!rateLimiter.checkLimit(socket.id, 'TRANSACTION')) {
  return callback({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
}
```

---

## 권한 검증

### 권한 수준

| 권한 | 검증 함수 | 해당 이벤트 |
|------|----------|-----------|
| **호스트 전용** | `isRoomHost(socketId, room)` | game:start, game:end, game:request_end, game_end_vote:cancel, player:kick |
| **방 멤버** | `isRoomMember(socketId, room)` | tx:request, vote:*, asset:rename 등 |
| **거래 당사자** | 직접 ID 비교 | tx:respond_cancel (상대방만) |
| **본인 알림** | 직접 ID 비교 | notification:mark_read 등 |
| **없음** | — | room:get, room:create, room:join |

### 검증 유틸 함수

> 참조: [`backend/src/utils/helpers.ts`](../backend/src/utils/helpers.ts)

```typescript
// 소켓이 방의 멤버인지 확인
function isRoomMember(socketId: string, room: Room): boolean

// 소켓이 방의 호스트인지 확인
function isRoomHost(socketId: string, room: Room): boolean
```

---

## CORS 전략

### 프로덕션 (Cloudflare Tunnel)

Same-Origin이므로 **CORS 미사용**. 프론트엔드와 백엔드가 같은 도메인에서 서빙된다.

```typescript
// 프로덕션: CORS 설정 없음 (Same-Origin)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: getCorsOrigins(), credentials: true }));
}
```

### 개발 환경

사설 IP 대역 허용:

```typescript
// 개발: localhost 및 사설 IP 허용
origin: ['http://localhost:15485', 'http://192.168.*:15485', ...]
```

---

## WebSocket Origin 검증

Socket.io 연결 시에도 CORS와 동일한 origin 검증을 적용한다:

```typescript
const io = new Server(httpServer, {
  cors: process.env.NODE_ENV !== 'production'
    ? { origin: getCorsOrigins(), credentials: true, methods: ['GET', 'POST'] }
    : undefined,
});
```

---

## 리소스 보호 제한값

> 참조: [`backend/src/utils/constants.ts`](../backend/src/utils/constants.ts)

| 상수 | 값 | 설명 |
|------|-----|------|
| `MAX_PLAYERS_PER_ROOM` | 10 | 방당 최대 플레이어 수 |
| `MAX_ROOMS_PER_IP` | 5 | IP당 최대 방 생성 수 |
| `MAX_AMOUNT` | 1,000,000,000 | 최대 거래 금액 (10억) |
| `MAX_NICKNAME_LENGTH` | 20 | 닉네임 최대 길이 |
| `MAX_ASSET_NAME_LENGTH` | 20 | 자산명 최대 길이 |
| `MAX_ROOM_AGE_MS` | 86,400,000 | 방 최대 존속 시간 (24시간) |

### 시간 기반 제한

| 상수 | 값 | 설명 |
|------|-----|------|
| `VOTE_TIMEOUT_MS` | 60초 | 투표 타임아웃 |
| `CANCEL_REQUEST_TIMEOUT_MS` | 60초 | 거래 취소 요청 만료 |
| `CANCEL_TIME_LIMIT_MS` | 120초 | 거래 취소 가능 시간 |
| `HOST_MIGRATION_DELAY_MS` | 120초 | 호스트 마이그레이션 대기 |
| `SESSION_EXPIRY_MS` | 300초 | 세션 만료 시간 |
| `ROOM_CLEANUP_DELAY_MS` | 300초 | 게임 종료 후 방 정리 대기 |
| `KICK_GRACE_PERIOD_MS` | 300초 | 킥 가능 유예 시간 |

---

## 참조

- [`backend/src/utils/validation.ts`](../backend/src/utils/validation.ts) — Zod 스키마 정의
- [`backend/src/utils/rate-limiter.ts`](../backend/src/utils/rate-limiter.ts) — RateLimiter 클래스
- [`backend/src/utils/constants.ts`](../backend/src/utils/constants.ts) — 모든 상수값
- [`backend/src/utils/helpers.ts`](../backend/src/utils/helpers.ts) — 권한 검증 함수
