# 🎲 Blue Marble Bank (부루마불 뱅크) - 시스템 명세서

> **버전**: 0.1.0  
> **최종 수정일**: 2025년 1월  
> **문서 목적**: 오프라인 보드게임 부루마불을 위한 웹 컴패니언 앱의 전체 시스템 플로우 명세

---

## 1. 시스템 개요

### 1.1 목적
종이 화폐 대신 스마트폰을 통해 부루마불 게임의 자산을 관리하고 플레이어 간 거래를 수행하는 실시간 웹 애플리케이션

### 1.2 기술 스택
| 구분 | 기술 |
|------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| 실시간 통신 | Socket.io (WebSocket) |
| 패키지 관리 | npm workspaces (Monorepo) |
| 상태 저장 | In-Memory Store (서버 재시작 시 초기화) |

### 1.3 시스템 구성
```
[Client A] ←──WebSocket──→ [Socket.io Server] ←──WebSocket──→ [Client B]
                                   ↓
                          [In-Memory Store]
                          - rooms: Map<roomId, Room>
                          - transactions: Map<txId, Transaction>
                          - votes: Map<voteId, Vote>
```

---

## 2. 데이터 모델 명세

### 2.1 Player (플레이어)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 플레이어 고유 식별자 (Socket ID) |
| nickname | string | 플레이어 닉네임 |
| cash | number | 보유 현금 (원) |
| assetValue | number | 부동산 자산 총액 (원) |
| roomId | string | 소속 방 ID |
| isReady | boolean | 준비 완료 여부 |
| isHost | boolean | 방장 여부 |
| connected | boolean | 연결 상태 |

### 2.2 Room (게임 방)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 방 고유 식별자 (6자리 영숫자) |
| status | RoomStatus | 방 상태: `LOBBY` / `PLAYING` / `ENDED` |
| players | Player[] | 참가 플레이어 목록 |
| welfareFund | number | 복지기금 총액 (원) |
| hostId | string | 방장 플레이어 ID |
| createdAt | number | 방 생성 시각 (timestamp) |

### 2.3 Transaction (거래)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 거래 고유 식별자 (UUID) |
| type | TransactionType | 거래 유형 |
| amount | number | 거래 금액 (원) |
| fromId | string \| 'BANK' \| 'FUND' | 송신자 ID |
| toId | string \| 'BANK' \| 'FUND' | 수신자 ID |
| timestamp | number | 거래 시각 (timestamp) |
| description | string | 거래 설명 (선택) |

**TransactionType 열거값:**
- `TRANSFER`: 플레이어 간 송금
- `BUY_ASSET`: 부동산 구매
- `PAY_COST`: 은행에 비용 지불
- `DONATE`: 복지기금 기부
- `SALARY`: 월급 수령
- `WELFARE_RECEIVE`: 복지기금 수령

### 2.4 Vote (투표)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 투표 고유 식별자 (UUID) |
| roomId | string | 소속 방 ID |
| requesterId | string | 요청자 플레이어 ID |
| amount | number | 요청 금액 (원) |
| status | VoteStatus | 투표 상태: `IN_PROGRESS` / `APPROVED` / `REJECTED` |
| votes | Record<string, boolean> | 투표 현황 {playerId: 찬성여부} |
| createdAt | number | 투표 생성 시각 |
| expiresAt | number | 투표 만료 시각 (생성 후 60초) |

---

## 3. 화면 흐름 명세

### 3.1 화면 구성
```
[Home] ──방 생성──→ [Lobby] ──게임 시작──→ [Dashboard]
   │                  ↑
   └───방 입장────────┘
```

### 3.2 Home 화면 (`/`)
**목적**: 사용자 닉네임 입력 및 방 생성/입장 선택

**UI 구성요소:**
- 닉네임 입력 필드
- "새로운 게임 (방 생성)" 버튼
- "방 코드로 입장" 버튼
- 방 코드 입력 필드 (입장 모드 시)

**동작:**
1. 사용자가 닉네임 입력
2. 방 생성 선택 시 → `room:create` 이벤트 발생 → Lobby로 이동
3. 방 입장 선택 시 → 방 코드 입력 → `room:join` 이벤트 발생 → Lobby로 이동

### 3.3 Lobby 화면 (`/lobby/:roomId`)
**목적**: 게임 시작 전 대기실, 참가자 확인

**UI 구성요소:**
- 방 코드 표시 (공유용)
- 참가자 목록 (닉네임, HOST 표시, 연결 상태)
- "게임 시작" 버튼 (방장에게만 표시)
- 대기 메시지 (일반 참가자에게 표시)

**동작:**
1. 새 참가자 입장 시 `room:sync` 이벤트로 참가자 목록 갱신
2. 방장이 "게임 시작" 클릭 → `game:start` 이벤트 발생
3. 모든 참가자 Dashboard로 자동 이동

### 3.4 Dashboard 화면 (`/game/:roomId`)
**목적**: 게임 진행 중 자산 관리 및 거래 수행

**UI 구성요소:**
- 내 현금 자산 표시
- 부동산 자산 가치 표시
- 거래 버튼들:
  - 송금하기 (TRANSFER)
  - 자산/비용 (BUY_ASSET, PAY_COST)
  - 복지기금 기부 (DONATE)
  - 월급 받기 (SALARY)
- 복지기금 현황 및 수령 요청 버튼
- 플레이어 랭킹 목록
- 투표 팝업 (투표 진행 시)

---

## 4. 기능별 플로우 명세

### 4.1 방 생성 (Room Creation)

**전제조건:**
- 클라이언트가 서버에 Socket 연결됨
- 닉네임이 입력됨

**플로우:**
```
1. [Client] 닉네임 입력 후 "방 생성" 클릭
2. [Client] socket.emit('room:create', nickname, callback)
3. [Server] RoomHandler에서 이벤트 수신
4. [Server] RoomService.createRoom(socketId, nickname) 호출
   4.1. 6자리 영숫자 방 ID 생성 (중복 검사)
   4.2. Host Player 객체 생성 (cash: 0, isHost: true)
   4.3. Room 객체 생성 (status: 'LOBBY', welfareFund: 0)
   4.4. store.rooms에 저장
5. [Server] socket.join(roomId) - 소켓 룸 입장
6. [Server] callback({ roomId }) - 방 ID 반환
7. [Server] socket.emit('room:sync', room) - 방 상태 동기화
8. [Client] /lobby/{roomId}로 네비게이션
```

**결과:**
- 새 방 생성됨
- 생성자가 방장(Host)으로 설정됨
- Lobby 화면으로 이동

---

### 4.2 방 입장 (Room Join)

**전제조건:**
- 유효한 방 ID가 존재함
- 방 상태가 `LOBBY`임
- 닉네임이 중복되지 않음

**플로우:**
```
1. [Client] 방 코드, 닉네임 입력 후 "입장하기" 클릭
2. [Client] socket.emit('room:join', roomId, nickname, callback)
3. [Server] RoomHandler에서 이벤트 수신
4. [Server] RoomService.joinRoom(roomId, socketId, nickname) 호출
   4.1. 방 존재 여부 확인
        - 없으면: { success: false, message: 'Room not found' } 반환
   4.2. 방 상태 확인
        - LOBBY가 아니면: { success: false, message: 'Game already started' } 반환
   4.3. 닉네임 중복 확인
        - 중복이면: { success: false, message: 'Nickname taken' } 반환
   4.4. Player 객체 생성 (isHost: false)
   4.5. room.players 배열에 추가
   4.6. { success: true } 반환
5. [Server] socket.join(roomId)
6. [Server] io.to(roomId).emit('room:sync', room) - 전체 브로드캐스트
7. [Server] callback({ success: true })
8. [Client] /lobby/{roomId}로 네비게이션
```

**실패 케이스:**
| 조건 | 에러 메시지 |
|------|-------------|
| 방 없음 | "Room not found" |
| 게임 진행 중 | "Game already started" |
| 닉네임 중복 | "Nickname taken" |

---

### 4.3 게임 시작 (Game Start)

**전제조건:**
- 요청자가 방장(Host)임
- 방 상태가 `LOBBY`임

**플로우:**
```
1. [Client-Host] "게임 시작" 버튼 클릭
2. [Client] socket.emit('game:start')
3. [Server] GameHandler에서 이벤트 수신
4. [Server] 호스트인 방 탐색 (store.rooms 순회)
   - 찾지 못하면: 무시 (권한 없음)
5. [Server] 방 상태 확인
   - LOBBY가 아니면: 무시
6. [Server] room.status = 'PLAYING' 으로 변경
7. [Server] io.to(roomId).emit('game:started')
8. [Server] io.to(roomId).emit('room:sync', room)
9. [Client-All] 'game:started' 수신 → /game/{roomId}로 네비게이션
10. [Client-All] Toast: "게임이 시작되었습니다!" + 효과음
```

**권한 검증:**
- 오직 방장만 게임 시작 가능
- 서버에서 hostId와 socket.id 비교하여 검증

---

### 4.4 거래 처리 (Transaction Processing)

#### 4.4.1 공통 플로우
```
1. [Client] 거래 정보 입력 (유형, 금액, 수신자)
2. [Client] socket.emit('tx:request', payload, callback)
3. [Server] TransactionHandler에서 이벤트 수신
4. [Server] 플레이어가 속한 방 ID 조회
5. [Server] TransactionService.processTransaction(roomId, socketId, payload) 호출
6. [Server] 거래 유형별 처리 (아래 상세)
7. [Server] Transaction 객체 생성 및 store.transactions에 저장
8. [Server] io.to(roomId).emit('tx:processed', transaction)
9. [Server] io.to(roomId).emit('room:sync', room)
10. [Server] callback({ success: true, txId })
11. [Client] Toast: "거래 성공!" + 효과음
```

#### 4.4.2 거래 유형별 처리 로직

**TRANSFER (송금)**
```
전제조건:
- toId(수신자)가 지정됨
- 수신자가 같은 방에 존재함
- 송신자 잔액 >= 금액

처리:
- sender.cash -= amount
- recipient.cash += amount
- fromId = sender.id, toId = recipient.id
```

**BUY_ASSET (부동산 구매)**
```
전제조건:
- 플레이어 잔액 >= 금액

처리:
- player.cash -= amount
- player.assetValue += amount
- fromId = player.id, toId = 'BANK'
```

**PAY_COST (비용 지불)**
```
전제조건:
- 플레이어 잔액 >= 금액

처리:
- player.cash -= amount
- fromId = player.id, toId = 'BANK'
```

**DONATE (복지기금 기부)**
```
전제조건:
- 플레이어 잔액 >= 금액

처리:
- player.cash -= amount
- room.welfareFund += amount
- fromId = player.id, toId = 'FUND'
```

**SALARY (월급 수령)**
```
전제조건:
- 없음 (항상 가능)

처리:
- player.cash += amount (기본 200,000원)
- fromId = 'BANK', toId = player.id
```

**WELFARE_RECEIVE (복지기금 수령)**
```
전제조건:
- 투표를 통해 승인됨 (또는 직접 호출 시 room.welfareFund >= amount)

처리:
- room.welfareFund -= amount
- player.cash += amount
- fromId = 'FUND', toId = player.id
```

#### 4.4.3 거래 실패 케이스
| 조건 | 에러 메시지 |
|------|-------------|
| 방 없음 | "Room not found" |
| 플레이어 없음 | "Player not found" |
| 금액 <= 0 | "Amount must be positive" |
| 수신자 미지정 (TRANSFER) | "Recipient required for transfer" |
| 수신자 없음 | "Recipient not found" |
| 잔액 부족 | "Insufficient funds" |
| 복지기금 부족 | "Insufficient welfare fund" |

---

### 4.5 복지기금 투표 (Welfare Fund Vote)

#### 4.5.1 투표 요청

**전제조건:**
- 요청 금액 <= 현재 복지기금
- 진행 중인 투표가 없음

**플로우:**
```
1. [Client] "수령 요청" 버튼 클릭 → 금액 입력 (prompt)
2. [Client] socket.emit('vote:request_fund', amount)
3. [Server] VoteHandler에서 이벤트 수신
4. [Server] VoteService.createVote(roomId, socketId, amount) 호출
   4.1. 복지기금 잔액 확인
        - 부족하면: throw Error('Insufficient welfare fund')
   4.2. 진행 중인 투표 확인
        - 있으면: throw Error('A vote is already in progress')
   4.3. Vote 객체 생성
        - status: 'IN_PROGRESS'
        - expiresAt: now + 60000 (1분 타임아웃)
   4.4. 요청자 자동 찬성 처리
        - vote.votes[requesterId] = true
   4.5. store.votes에 저장
5. [Server] io.to(roomId).emit('vote:started', vote)
6. [Server] io.to(roomId).emit('vote:updated', vote)
7. [Client-All] VotePopup 표시 + Toast: "새로운 투표가 시작되었습니다"
```

#### 4.5.2 투표 수행

**플로우:**
```
1. [Client] VotePopup에서 찬성/반대 버튼 클릭
2. [Client] socket.emit('vote:cast', voteId, approve)
3. [Server] VoteHandler에서 이벤트 수신
4. [Server] VoteService.castVote(voteId, voterId, approve) 호출
   4.1. 투표 존재 및 상태 확인
        - 없으면: throw Error('Vote not found')
        - 종료됨: throw Error('Vote is closed')
   4.2. 투표 기록
        - vote.votes[voterId] = approve
   4.3. 결과 판정 (checkVoteOutcome)
5. [Server] io.to(roomId).emit('vote:updated', vote)
6. [Server] 투표 종료 시:
   6.1. io.to(roomId).emit('vote:ended', vote)
   6.2. io.to(roomId).emit('room:sync', room)
7. [Client-All] VotePopup 업데이트 또는 닫기
```

#### 4.5.3 투표 결과 판정 로직

```
입력:
- totalPlayers: 전체 플레이어 수
- votesCast: 투표 완료 인원 수
- approvals: 찬성 수
- rejections: 반대 수
- threshold: totalPlayers / 2

판정:
IF approvals > threshold THEN
    status = 'APPROVED'
    → transactionService.processTransaction(WELFARE_RECEIVE) 실행
    → 요청자에게 금액 지급
ELSE IF votesCast === totalPlayers THEN
    status = 'REJECTED'
    → 아무 동작 없음
ELSE
    status = 'IN_PROGRESS' (계속 대기)
END IF
```

**승인 조건:**
- 과반수 초과 찬성 (> 50%)
- 예: 4명 중 3명 찬성 → 승인
- 예: 4명 중 2명 찬성 → 부결 (동률은 부결)

---

## 5. 소켓 이벤트 명세

### 5.1 Client → Server 이벤트

| 이벤트 | 파라미터 | 설명 |
|--------|----------|------|
| `room:create` | nickname: string, callback | 새 방 생성 |
| `room:join` | roomId: string, nickname: string, callback | 방 입장 |
| `game:start` | (없음) | 게임 시작 (방장만) |
| `tx:request` | payload: Transaction, callback | 거래 요청 |
| `vote:request_fund` | amount: number | 복지기금 수령 요청 |
| `vote:cast` | voteId: string, approve: boolean | 투표 수행 |

### 5.2 Server → Client 이벤트

| 이벤트 | 파라미터 | 설명 |
|--------|----------|------|
| `room:sync` | room: Room | 방 상태 동기화 (브로드캐스트) |
| `game:started` | (없음) | 게임 시작 알림 |
| `tx:processed` | transaction: Transaction | 거래 처리 완료 알림 |
| `vote:started` | vote: Vote | 투표 시작 알림 |
| `vote:updated` | vote: Vote | 투표 현황 업데이트 |
| `vote:ended` | vote: Vote | 투표 종료 알림 |
| `error` | message: string | 에러 메시지 |

---

## 6. 에러 처리 명세

### 6.1 클라이언트 에러 처리
- Toast 알림으로 사용자에게 에러 메시지 표시
- 에러 사운드 재생 (`playError()`)
- 콜백의 `success: false` 및 `error` 필드 확인

### 6.2 서버 에러 처리
- try-catch로 예외 포착
- 콜백 존재 시: `callback({ success: false, error: message })`
- 콜백 없을 시: `socket.emit('error', message)`

### 6.3 에러 메시지 목록
| 코드 | 메시지 | 발생 상황 |
|------|--------|-----------|
| E001 | Room not found | 존재하지 않는 방 ID |
| E002 | Game already started | LOBBY 상태가 아닌 방 입장 시도 |
| E003 | Nickname taken | 중복 닉네임 |
| E004 | Player not found | 존재하지 않는 플레이어 |
| E005 | Amount must be positive | 0 이하 금액 거래 |
| E006 | Recipient required for transfer | 송금 시 수신자 미지정 |
| E007 | Recipient not found | 존재하지 않는 수신자 |
| E008 | Insufficient funds | 현금 잔액 부족 |
| E009 | Insufficient welfare fund | 복지기금 잔액 부족 |
| E010 | A vote is already in progress | 중복 투표 요청 |
| E011 | Vote not found | 존재하지 않는 투표 |
| E012 | Vote is closed | 종료된 투표에 투표 시도 |

---

## 7. 보안 및 제약사항

### 7.1 권한 검증
- 게임 시작: 방장 여부 검증 (hostId === socket.id)
- 거래: 요청자가 해당 방의 플레이어인지 검증
- 투표: 요청자가 해당 방의 플레이어인지 검증

### 7.2 데이터 무결성
- 모든 금액 연산은 서버에서 수행
- 클라이언트는 UI 표시만 담당
- 잔액 부족 시 거래 거부

### 7.3 현재 제약사항
- In-Memory Store 사용 → 서버 재시작 시 데이터 손실
- 재접속 미지원 → 연결 끊김 시 재입장 불가
- 방 삭제 로직 미구현 → 메모리 누수 가능

---

## 8. 부록: 상수값

### 8.1 기본 설정값
| 항목 | 값 | 설명 |
|------|-----|------|
| 방 ID 길이 | 6자리 | 영문 대문자 + 숫자 |
| 초기 현금 | 0원 | 방 생성/입장 시 |
| 월급 기본값 | 200,000원 | SALARY 거래 시 |
| 투표 타임아웃 | 60초 | 투표 만료 시간 |

### 8.2 방 상태 흐름
```
LOBBY ──게임 시작──→ PLAYING ──게임 종료──→ ENDED
  ↑                                        (미구현)
  └────────────────────────────────────────┘
```

---

*문서 끝*
