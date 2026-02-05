import type { Room, Transaction, Vote, DisconnectedSession, Notification, GameEndVote, CancelRequest } from '@blue-banker/shared';

class Store {
  public rooms: Map<string, Room> = new Map();
  // We can store transactions/votes by ID or grouped by Room depending on access patterns
  // For now, simple maps or arrays
  // But shared types don't define a global list, just entities.
  
  // Let's store transactions per Room for easier lookup? or Global?
  // User Story 2 says "View transaction history". Usually filtered by player or room.
  public transactions: Map<string, Transaction> = new Map(); 
  public votes: Map<string, Vote> = new Map();
  // Disconnected sessions for reconnection (T013)
  public disconnectedSessions: Map<string, DisconnectedSession> = new Map();
  // T009: notifications Map 추가
  public notifications: Map<string, Notification> = new Map();
  // T010: gameEndVotes Map 추가
  public gameEndVotes: Map<string, GameEndVote> = new Map();
  // NEW: 거래 취소 요청 저장소
  public cancelRequests: Map<string, CancelRequest> = new Map();
  // NEW: 투표 타임아웃 타이머 관리
  public voteTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.rooms = new Map();
  }

  // T011: 플레이어별 거래 내역 조회
  getPlayerTransactions(playerId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.fromId === playerId || tx.toId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // T012: 플레이어별 읽지 않은 알림 개수
  getUnreadNotificationCount(playerId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.targetPlayerId === playerId && !n.read)
      .length;
  }

  reset() {
    this.rooms.clear();
    this.transactions.clear();
    this.votes.clear();
    this.disconnectedSessions.clear();
    this.notifications.clear();
    this.gameEndVotes.clear();
    this.cancelRequests.clear();
    // 타임아웃 타이머 정리
    this.voteTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.voteTimeouts.clear();
  }
}

export const store = new Store();


