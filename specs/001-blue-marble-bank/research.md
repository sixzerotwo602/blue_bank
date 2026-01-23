# Research: 부루마불 은행 동반 앱

**Feature**: 001-blue-marble-bank
**Date**: 2026-01-23

## 1. Testing Framework

### Decision: Vitest + React Testing Library (Frontend) & Vitest (Backend)

**Rationale**:

- **Unified Runner**: 프론트엔드(Vite)와 백엔드(Node) 모두에서 동일한 Runner를 사용하여 설정 복잡도를 낮춤.
- **Speed**: Vite 기반으로 동작하여 Jest 대비 빠른 실행 속도 제공.
- **Support**: ESM 및 TypeScript 기본 지원 (별도 설정 최소화).
- **Integration**: `socket.io-client`를 활용한 통합 테스트 작성이 용이함.

**Alternatives Considered**:

- **Jest**: Node.js 환경의 표준이지만, ESM 설정이 까다롭고 Vite 프로젝트와의 통합 시 속도가 느림.
- **Mocha/Chai**: 유연하지만 설정해야 할 부분이 많아 "Simplicity" 원칙에 덜 부합함.

## 2. State Management (Frontend)

### Decision: React Context API + Socket Events

**Rationale**:

- **Simplicity**: 앱의 규모(방, 플레이어 수)가 크지 않아 Redux/Recoil 같은 무거운 라이브러리가 불필요함.
- **Real-time**: Socket 이벤트가 상태 변경의 주체이므로, 수신된 이벤트를 Context에 반영하는 패턴이 직관적임.

**Alternatives Considered**:

- **Redux Toolkit**: 보일러플레이트가 많음.
- **Zustand**: 가볍고 좋으나, Context API만으로도 현재 요구사항 충족 가능 (외부 의존성 줄이기).

## 3. Real-time Communication

### Decision: Socket.io (Room-based)

**Rationale**:

- **Abstraction**: WebSocket을 직접 다루는 것보다 Room, Namespace, Reconnection 기능이 내장된 Socket.io가 생산성이 높음.
- **Stability**: 모바일 네트워크 전환 시 자동 재연결 지원이 필수적임.

**Alternatives Considered**:

- **Raw WebSockets (`ws`)**: 가볍지만 재연결, 룸 관리 로직을 직접 구현해야 하므로 개발 비용 증가.
