# 데이터 모델: 게임 정산 (Game Settlement)

## 엔티티 (Entities)

### Room (방)

- **상태 (State)**: `status` enum/union에 `ENDED` 추가.
  - `WAITING` | `PLAYING` | `ENDED`
- **필드**: MVP를 위한 별도 영속성 필드는 없으나, 런타임에 `rankings` 계산이 필요함.

### Player (플레이어)

- **계산된 필드** (정산용):
  - `totalAssets` (총 자산) = `cash` (현금) + `assetValue` (부동산 가치)
  - `rank` (등수): 정수 (1부터 시작)

## 로직 (Logic)

1. **순위 계산**:
   ```typescript
   players.sort((a, b) => b.cash + b.assetValue - (a.cash + a.assetValue));
   ```
