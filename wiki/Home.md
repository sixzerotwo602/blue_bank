# Blue Bank Wiki

> 오프라인 보드게임 **부루마불(Blue Marble)** 플레이를 돕는 웹 컴패니언 앱 — 종이 화폐 대신 스마트폰으로 간편하게 자산을 관리하고 거래합니다.

프로젝트 소개는 [README.md](../README.md)를 참고하세요.

---

## 개발 원칙

| 문서 | 설명 |
|------|------|
| [architecture.md](./architecture.md) | 백엔드 DDD 4계층 아키텍처, 의존성 방향, 수동 DI |
| [frontend-architecture.md](./frontend-architecture.md) | 프론트엔드 Atomic Design + Feature 기반 구조 |
| [coding-conventions.md](./coding-conventions.md) | 언어 규칙, ESM, Companion Module 패턴, 네이밍 |
| [security.md](./security.md) | Zod 검증, Rate Limiting, 권한 체계, CORS |
| [testing.md](./testing.md) | Vitest 기반 테스트 전략 및 작성 지침 |

## 시스템 레퍼런스

| 문서 | 설명 |
|------|------|
| [data-model.md](./data-model.md) | 핵심 타입, 열거형, MemoryStore 구조 |
| [socket-events.md](./socket-events.md) | Client↔Server 소켓 이벤트 전체 레퍼런스 |
| [state-management.md](./state-management.md) | 프론트엔드 Context, useGame 훅, 데이터 흐름 |

## 운영

| 문서 | 설명 |
|------|------|
| [development-setup.md](./development-setup.md) | 개발 환경 구축, 빌드 순서, 디버깅 팁 |
| [deployment.md](./deployment.md) | Cloudflare Tunnel, GitHub Actions, PM2 운영 |

---

## 관련 문서

| 폴더 | 성격 | 예시 |
|------|------|------|
| [`docs/`](../docs/) | 기술 조사, 대안 분석, 프로토타입 참조 (시점 스냅샷) | `cloudflare-tunnel-domain-protection.md`, `ui-tool-integration.md` |
| [`specs/`](../specs/) | 기능별 상세 스펙/태스크 (기능 개발 완료 후 아카이브) | `001-spec/` ~ `010-backend-refactor/` |
| [`CLAUDE.md`](../CLAUDE.md) | AI 어시스턴트 개발 지침 | 기술 스택, 프로젝트 구조, 코드 스타일 |
