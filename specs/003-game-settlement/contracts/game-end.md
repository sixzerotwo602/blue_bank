# API 계약: 게임 정산 (Game Settlement)

## 소켓 이벤트 (Socket Events)

### 클라이언트 -> 서버 (Client -> Server)

#### `game:end`

- **설명**: 호스트가 게임 종료를 요청합니다.
- **페이로드**:
  ```json
  {
    "roomId": "string"
  }
  ```
- **응답**: 없음 (서버가 `game:ended`를 브로드캐스트하거나 `error`를 보냄).
- **권한**: 전송자는 해당 `roomId`의 호스트여야 합니다.

### 서버 -> 클라이언트 (Server -> Client)

#### `game:ended`

- **설명**: 게임이 종료되었을 때 방에 있는 모든 플레이어에게 브로드캐스트됩니다.
- **페이로드**:
  ```json
  {
    "rankings": [
      {
        "id": "string",
        "nickname": "string",
        "cash": number,
        "assetValue": number,
        "totalAssets": number,
        "rank": number
      }
      // ... 순서대로 정렬된 리스트
    ]
  }
  ```
