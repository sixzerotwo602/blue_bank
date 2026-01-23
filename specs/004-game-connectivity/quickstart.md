# Quickstart: Game Connectivity

**Feature**: 004-game-connectivity  
**Date**: 2026-01-23

## 개요

게임 연결성 기능을 구현하기 위한 빠른 시작 가이드입니다.

## 필수 선행 작업

1. `shared/src/index.ts`에 새로운 타입 정의 추가 (contracts/socket-events.md 참조)
2. `npm run build` (shared 패키지 빌드)

## 구현 순서

### Phase 1: 연결 상태 표시 (P1)

1. **Backend**: Player 모델에 `connectionStatus`, `lastSeenAt` 필드 추가
2. **Backend**: `connection.service.ts` 생성 - 연결 상태 관리
3. **Backend**: disconnect 이벤트 핸들러에서 상태 업데이트 로직 추가
4. **Frontend**: `ConnectionStatus.tsx` 컴포넌트 생성
5. **Frontend**: Lobby/Dashboard에 연결 상태 표시

### Phase 2: 재접속 및 세션 복원 (P1)

1. **Backend**: `DisconnectedSession` 저장소 구현 (Store 확장)
2. **Backend**: `room:rejoin` 핸들러 구현
3. **Backend**: 세션 만료 타이머 구현 (5분)
4. **Frontend**: `useSocket.ts`에 재연결 로직 추가
5. **Frontend**: `ReconnectOverlay.tsx` 컴포넌트 생성

### Phase 3: 호스트 이전 (P2)

1. **Backend**: 호스트 이전 타이머 로직 구현 (2분 대기)
2. **Backend**: 입장 순서 기반 다음 호스트 선정 로직
3. **Backend**: `host:migrating`, `host:migrated` 이벤트 emit
4. **Frontend**: 호스트 이전 알림 UI

### Phase 4: 플레이어 강제 퇴장 (P3)

1. **Backend**: `player:kick` 핸들러 구현
2. **Backend**: 5분 오프라인 검증 로직
3. **Backend**: 자산 말소 로직
4. **Frontend**: 강제 퇴장 버튼 UI (호스트 전용)

### Phase 5: 자동 재연결 (P3)

1. **Frontend**: Socket.IO reconnection 옵션 설정
2. **Frontend**: 재연결 진행 상황 UI

## 핵심 파일

| 파일                                           | 작업             |
| ---------------------------------------------- | ---------------- |
| `shared/src/index.ts`                          | 타입 정의 추가   |
| `backend/src/models/store.ts`                  | Player 필드 확장 |
| `backend/src/services/connection.service.ts`   | NEW              |
| `backend/src/handlers/connection.handler.ts`   | NEW              |
| `frontend/src/components/ConnectionStatus.tsx` | NEW              |
| `frontend/src/components/ReconnectOverlay.tsx` | NEW              |
| `frontend/src/hooks/useSocket.ts`              | 수정             |

## 테스트 시나리오

1. 플레이어 접속 → 연결 상태 녹색 표시
2. 브라우저 탭 닫기 → 3초 내 오프라인 표시
3. 5분 내 재접속 → 세션 복원 확인
4. 호스트 연결 끊기 → 2분 후 호스트 이전
5. 5분 오프라인 → 강제 퇴장 버튼 활성화
