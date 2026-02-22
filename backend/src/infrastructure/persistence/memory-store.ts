import type { Room, Transaction, Vote, DisconnectedSession, Notification, GameEndVote, CancelRequest } from '@blue-banker/shared';

/**
 * 순수 데이터 컨테이너 — 비즈니스 로직 없음
 * 모든 Map 인스턴스를 보유하고, 리포지토리 구현체가 이를 참조한다.
 */
export class MemoryStore {
  readonly rooms = new Map<string, Room>();
  readonly transactions = new Map<string, Transaction>();
  readonly votes = new Map<string, Vote>();
  readonly disconnectedSessions = new Map<string, DisconnectedSession>();
  readonly notifications = new Map<string, Notification>();
  readonly gameEndVotes = new Map<string, GameEndVote>();
  readonly cancelRequests = new Map<string, CancelRequest>();

  // 보조 인덱스
  readonly playerToRoom = new Map<string, string>();           // playerId → roomId
  readonly roomTransactions = new Map<string, Set<string>>();  // roomId → Set<txId>
  readonly playerNotifications = new Map<string, Set<string>>(); // playerId → Set<notifId>
  readonly roomCreatorIps = new Map<string, string>();         // roomId → creatorIp

  reset(): void {
    this.rooms.clear();
    this.transactions.clear();
    this.votes.clear();
    this.disconnectedSessions.clear();
    this.notifications.clear();
    this.gameEndVotes.clear();
    this.cancelRequests.clear();
    this.playerToRoom.clear();
    this.roomTransactions.clear();
    this.playerNotifications.clear();
    this.roomCreatorIps.clear();
  }
}

export const memoryStore = new MemoryStore();
