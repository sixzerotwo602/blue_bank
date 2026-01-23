# Blue Marble Bank Walkthrough

## Overview

Blue Marble Bank is a companion web application for the Blue Marble board game, handling financial transactions, welfare funds, and rankings. This walkthrough validates the implementation of Phases 1-7.

## 1. Setup & Connection

### Server Start

- Backend Service running on `http://localhost:3000` (Express + Socket.io)
- Frontend Client running on `http://localhost:5173` (Vite + React)
- **Validation**:
  - Open 4 browser tabs.
  - All tabs should show "Online" status (or not show connection error).

## 2. Room Creation & Lobby

### User Flow

1. **User A** enters nickname "Alice" and clicks "방 만들기".
   - **Result**: Redirected to Lobby (`/lobby/[ROOM_ID]`). Room ID displayed (e.g., `ROOM_123`).
   - **Notification**: "방 생성 완료: ROOM_123" toast appears.

2. **User B, C, D** enter their nicknames and Room ID `ROOM_123`, then click "입장하기".
   - **Result**: Redirected to Lobby.
   - **Notification**: "ROOM_123번 방 입장!" toast appears.
3. **Lobby State**:
   - All users see the list of connected players.
   - Host (Alice) sees "게임 시작" button.

4. **Game Start**:
   - Host clicks "게임 시작".
   - **Result**: All players redirected to Dashboard (`/game/ROOM_123`).
   - **Sound**: Success sound plays.

## 3. Dashboard & Transactions (MVP)

### Dashboard UI

- **Top**: Room ID and Game Title.
- **Center**: Current Cash Balance (Green), Asset Value (Blue).
- **Actions**:
  - 💸 **송금하기 (Transfer)**: Send money to other players.
  - 🏠 **자산/비용 (Buy/Pay)**: Buy lands or pay fees to bank.
  - 🤝 **복지기금 기부 (Donate)**: Donate to public fund.
  - 💵 **월급 받기 (Salary)**: Receive 200,000 KRW from bank.
- **Bottom**: Welfare Fund Status and Ranking List.

### Transaction Verification

1. **Salary**:
   - User A clicks "월급 받기".
   - **Result**: Cash increases by 200,000.
   - **Notification**: "거래 성공!" toast.

2. **Transfer**:
   - User A transfers 100,000 to User B.
   - **User A**: Cash decreases by 100,000.
   - **User B**: Cash increases by 100,000.
   - **Validation**: Check both screens.

3. **Buy Asset**:
   - User B buys land for 300,000.
   - **Result**: Cash decreases by 300,000. Asset Value increases by 300,000.
   - **Total Asset**: Remains unchanged (Cash -> Asset swap), unless fees applied.

## 4. Welfare Fund System

### Donation

- User C donates 50,000 to Welfare Fund.
- **Result**: User C cash -50,000. Welfare Fund (displayed on all dashboards) +50,000.

### Fund Request & Voting

- User D clicks "수령 요청" on Welfare Fund card.
- Enters amount (e.g., all of it).
- **Result**: "투표가 시작되었습니다" toast on all screens.
- **Vote Popup**: Appears on all screens with Approve (O) / Reject (X) buttons.

### Voting Process

- Users A, B, C vote "O" (Approve).
- **Result**: Vote passes (Majority).
- **Outcome**: User D receives the fund amount. Welfare Fund resets to 0.
- **Notification**: "투표 승인됨!" toast + Success sound.

## 5. Ranking System

### Real-time Leaderboard

- Located at the bottom of the dashboard.
- Sorts players by Total Assets (Cash + Lands).
- **Verification**:
  - As User B bought land, their total asset value is preserved.
  - As User A transferred money, their total asset dropped.
  - As User D received fund, their total asset increased.
  - Ranking should update immediately after any transaction.
- **Highlight**: Current user is highlighted in the list. top 3 get medals (implied by design intention).

## 6. Polish (Notifications & Sound)

- **Toasts**: `react-hot-toast` confirms all actions (Green for success, Red for failure).
- **Sounds**: `use-sound` triggers feedback on key events (Game Start, Transaction Success, Vote Result).

## Summary

The application successfully implements all planned user stories for the Blue Marble Bank.
