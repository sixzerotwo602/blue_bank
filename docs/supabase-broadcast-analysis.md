# Supabase Realtime Broadcast 적용 가능성 분석

> 작성일: 2026-02-12
> 결론: **적합하지 않음**

---

## 현재 아키텍처 요약

| 항목 | 현황 |
|------|------|
| **실시간 통신** | Socket.io 4.8.3 (WebSocket) |
| **서버** | Express 5.2.1 + 커스텀 Node.js 서버 |
| **상태 저장** | In-memory Map 기반 Store (7개 Map + 3개 보조 인덱스) |
| **비즈니스 로직** | 95% 서버 측 (거래, 투표, 자산, 연결 관리) |
| **메시지 패턴** | 서버 중개 95%, 브로드캐스트 60%, 유니캐스트 35%, P2P 0% |
| **타이머** | TimerManager 싱글톤 (투표 60초, 호스트 마이그레이션 120초 등) |
| **핸들러** | 6개 모듈 (room, game, transaction, vote, connection, notification) |
| **이벤트** | 클라이언트→서버 ~20개, 서버→클라이언트 ~25개 |

---

## Supabase Realtime Broadcast 특징

| 항목 | 설명 |
|------|------|
| **기본 개념** | 채널 기반 클라이언트 간 Pub/Sub 메시지 릴레이 |
| **통신 방식** | 구독 전: HTTP / 구독 후: WebSocket |
| **서버 로직** | 없음 - 메시지를 그대로 전달만 함 |
| **사용 사례** | 채팅, 커서 공유, 실시간 알림 등 **단순 메시지 전달** |
| **코드 예시** | `channel.send({ type: 'broadcast', event: 'shout', payload: {...} })` |
| **수신** | `channel.on('broadcast', { event: 'shout' }, callback).subscribe()` |
| **인프라** | Supabase 호스팅 (관리형 서비스) |

---

## 적용 가능성 분석: **적합하지 않음**

### 핵심 불일치 사유

#### 1. 서버 측 비즈니스 로직 부재

Supabase Broadcast는 **메시지 릴레이** 서비스로, 서버 측 로직 실행이 불가하다.

현재 프로젝트에서 서버가 처리하는 핵심 로직:
- **거래 검증**: 잔액 확인, 자산 소유 확인, 거래 유형별 처리 (7가지)
- **투표 시스템**: 정족수 계산, 타임아웃 처리, 자동 실행
- **자산 매입/매각**: 건물 유형 검증, 토지 위 건물 배치, 반액 매각
- **거래 취소**: 잠금 확인, 타임아웃, 상대방 응답 대기
- **호스트 마이그레이션**: 연결 상태 모니터링, 자동 위임

> Broadcast로 이동하면 이 모든 로직을 **클라이언트에서 실행**해야 하며, 이는 **부정행위에 완전히 노출**된다.

#### 2. 상태 관리 불가

현재 Store는 7개의 Map과 3개의 보조 인덱스로 게임 상태를 중앙 관리한다.
Broadcast에는 상태 저장 기능이 없어, 클라이언트 간 상태 동기화가 보장되지 않는다.

#### 3. 타이머/스케줄링 불가

TimerManager가 관리하는 서버 측 타이머(투표 60초, 호스트 마이그레이션 120초 등)를 Broadcast에서는 구현할 수 없다.

#### 4. 유니캐스트 지원 부족

현재 이벤트의 ~35%는 **특정 플레이어에게만** 전송된다 (알림, 거래 취소 요청 등).
Broadcast는 채널 전체 브로드캐스트 중심이라 세밀한 타겟팅이 어렵다.

#### 5. 타입 안전성 손실

현재 `ClientToServerEvents` / `ServerToClientEvents` 인터페이스로 완전한 타입 안전성을 확보하고 있으나, Supabase Broadcast는 generic JSON payload만 지원한다.

---

### 비교 표

| 기능 | Socket.io (현재) | Supabase Broadcast |
|------|-----------------|-------------------|
| 서버 측 로직 | O (Express 핸들러) | X |
| 상태 저장 | O (In-memory Store) | X |
| 타이머/스케줄링 | O (TimerManager) | X |
| 유니캐스트 | O (`io.to(playerId)`) | 제한적 |
| 타입 안전성 | O (제네릭 인터페이스) | X (JSON payload) |
| Room 관리 | O (Socket.io Room) | O (Channel) |
| 자동 재연결 | O | O |
| 인프라 관리 | 자체 서버 필요 | 관리형 (Supabase) |
| 비용 | 서버 비용만 | Supabase 요금제 |

---

## 만약 Supabase를 사용하고 싶다면?

Broadcast **단독**으로는 불가하지만, **Supabase 풀스택**으로 전환하면 이론적으로 가능하다:

| 현재 컴포넌트 | Supabase 대체 |
|--------------|--------------|
| Express 서버 | Supabase Edge Functions |
| In-memory Store | Supabase PostgreSQL (Realtime DB 변경 감지) |
| Socket.io | Supabase Realtime (Broadcast + Presence + DB Changes) |
| TimerManager | Edge Functions + pg_cron |

**그러나** 이는 사실상 **전체 재작성**에 해당하며:
- 백엔드 핸들러 6개 → Edge Functions 재작성
- 서비스 레이어 전체 → PostgreSQL + Edge Functions
- Store → PostgreSQL 스키마 설계
- 프론트엔드 훅 → Supabase Client로 전환
- shared 타입 → Supabase 스키마 기반으로 재정의

---

## 결론

**Supabase Realtime Broadcast는 현재 프로젝트에 적합하지 않다.**

- Broadcast는 **단순 메시지 릴레이** 서비스이고, 현재 프로젝트는 **복잡한 서버 측 비즈니스 로직**(거래 검증, 투표, 자산 관리, 타이머)에 크게 의존한다.
- 현재 Socket.io + Express 아키텍처가 이 프로젝트의 요구사항에 정확히 부합한다.
- Supabase 전환은 전체 재작성이 필요하며, 현 시점에서 이점보다 비용이 훨씬 크다.

### Supabase Broadcast가 적합한 프로젝트 유형

- 실시간 채팅 (서버 로직 최소)
- 커서/프레즌스 공유 (Figma 스타일)
- 실시간 알림 (단순 전달)
- 프로토타이핑 (빠른 개발)
