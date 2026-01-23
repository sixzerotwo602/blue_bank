# Walkthrough: Game Settlement Feature

## Overview

The Game Settlement feature allows the Host to formally end the game, calculating final rankings based on total assets (Cash + Real Estate Value) and displaying the results to all players.

## Changes

### Backend

- **Room Model**: Added `ENDED` status.
- **Game Handler**: Added `game:end` listener.
  - Validates Host permissions.
  - Updates Room status.
  - Calculates rankings: `Total Assets = Cash + Asset Value`.
  - Broadcasts `game:ended` with sorted rankings.

### Frontend

- **SettlementView**: New full-screen component.
  - Displays rankings in a responsive list.
  - Highlights the winner (Crow/Gold).
  - Shows breakdown of Cash vs. Assets.
  - "Go Home" button to exit.
- **Dashboard**:
  - Added "Game End" button (Host only, Red, Bottom).
  - Integrated `ConfirmModal` for safety.
  - Renders `SettlementView` upon game end.
- **useGame Hook**:
  - Handles `game:ended` event.
  - Manages `rankings` state.

## Verification

1. **Host Action**: Clicked "Game End" -> Confirmation Modal appeared -> Confirmed.
2. **Server Logic**: Verified ranking sort order (Descending Total Assets).
3. **Client UI**:
   - All clients received the event.
   - Settlement overlay appeared on top.
   - Winner highlighted correctly.
   - "Go Home" redirected to root `/`.

## Screenshots

(Placeholder for actual screenshots if available)

- [Game End Button]
- [Settlement Overlay]
