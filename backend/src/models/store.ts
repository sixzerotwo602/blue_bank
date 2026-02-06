import type { Room, Transaction, Vote, DisconnectedSession, Notification, GameEndVote, CancelRequest } from '@blue-banker/shared';
import { timerManager } from '../utils/timer-manager.js';

class Store {
  public rooms: Map<string, Room> = new Map();
  public transactions: Map<string, Transaction> = new Map();
  public votes: Map<string, Vote> = new Map();
  public disconnectedSessions: Map<string, DisconnectedSession> = new Map();
  public notifications: Map<string, Notification> = new Map();
  public gameEndVotes: Map<string, GameEndVote> = new Map();
  public cancelRequests: Map<string, CancelRequest> = new Map();

  // 보조 인덱스 (Phase 3)
  public playerToRoom: Map<string, string> = new Map();           // playerId → roomId
  public roomTransactions: Map<string, Set<string>> = new Map();  // roomId → Set<txId>
  public playerNotifications: Map<string, Set<string>> = new Map(); // playerId → Set<notifId>

  constructor() {
    this.rooms = new Map();
  }

  // 인덱스 기반 방 조회
  getPlayerRoom(playerId: string): string | undefined {
    return this.playerToRoom.get(playerId);
  }

  // 인덱스 기반 방별 거래 조회
  getRoomTransactions(roomId: string): Transaction[] {
    const txIds = this.roomTransactions.get(roomId);
    if (!txIds) return [];
    const result: Transaction[] = [];
    for (const txId of txIds) {
      const tx = this.transactions.get(txId);
      if (tx) result.push(tx);
    }
    return result;
  }

  // 인덱스 기반 플레이어별 알림 조회
  getPlayerNotifications(playerId: string): Notification[] {
    const notifIds = this.playerNotifications.get(playerId);
    if (!notifIds) return [];
    const result: Notification[] = [];
    for (const notifId of notifIds) {
      const notif = this.notifications.get(notifId);
      if (notif) result.push(notif);
    }
    return result;
  }

  // 플레이어별 거래 내역 조회 (복지기금 기부 락 상태 포함)
  getPlayerTransactions(playerId: string): Transaction[] {
    const hasWelfareReceive = Array.from(this.transactions.values())
      .some(tx => tx.type === 'WELFARE_RECEIVE' && tx.status !== 'CANCELLED');

    return Array.from(this.transactions.values())
      .filter(tx => tx.fromId === playerId || tx.toId === playerId)
      .map(tx => {
        if (tx.type === 'DONATE' && tx.toId === 'FUND' && tx.status !== 'CANCELLED') {
          return { ...tx, locked: hasWelfareReceive };
        }
        return tx;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // 플레이어별 읽지 않은 알림 개수 (인덱스 기반)
  getUnreadNotificationCount(playerId: string): number {
    const notifIds = this.playerNotifications.get(playerId);
    if (!notifIds) return 0;
    let count = 0;
    for (const notifId of notifIds) {
      const notif = this.notifications.get(notifId);
      if (notif && !notif.read) count++;
    }
    return count;
  }

  // 방과 관련된 모든 데이터 일괄 삭제
  cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // 해당 방 플레이어들의 인덱스 정리
    for (const player of room.players) {
      this.playerToRoom.delete(player.id);
      // 플레이어 알림 정리
      const notifIds = this.playerNotifications.get(player.id);
      if (notifIds) {
        for (const notifId of notifIds) {
          this.notifications.delete(notifId);
        }
        this.playerNotifications.delete(player.id);
      }
    }

    // 해당 방의 거래 정리 (roomTransactions 인덱스 활용)
    const txIds = this.roomTransactions.get(roomId);
    if (txIds) {
      for (const txId of txIds) {
        this.transactions.delete(txId);
      }
      this.roomTransactions.delete(roomId);
    }

    // 해당 방의 투표 정리
    for (const [voteId, vote] of this.votes.entries()) {
      if (vote.roomId === roomId) {
        this.votes.delete(voteId);
      }
    }

    // 해당 방의 게임 종료 투표 정리
    for (const [voteId, vote] of this.gameEndVotes.entries()) {
      if (vote.roomId === roomId) {
        this.gameEndVotes.delete(voteId);
      }
    }

    // 해당 방의 거래 취소 요청 정리
    for (const [requestId, request] of this.cancelRequests.entries()) {
      // cancelRequest에는 roomId가 없으므로 transactionId로 역추적
      const tx = this.transactions.get(request.transactionId);
      if (!tx) {
        // 이미 거래가 삭제된 경우 (위에서 삭제됨) → 같이 삭제
        this.cancelRequests.delete(requestId);
      }
    }

    // 해당 방의 disconnectedSessions 정리
    for (const [key, session] of this.disconnectedSessions.entries()) {
      if (session.roomId === roomId) {
        this.disconnectedSessions.delete(key);
      }
    }

    // 방 삭제
    this.rooms.delete(roomId);

    // 해당 방의 모든 타이머 정리
    timerManager.clearByPrefix(`${roomId}:`);
  }

  reset() {
    this.rooms.clear();
    this.transactions.clear();
    this.votes.clear();
    this.disconnectedSessions.clear();
    this.notifications.clear();
    this.gameEndVotes.clear();
    this.cancelRequests.clear();
    // 인덱스 초기화
    this.playerToRoom.clear();
    this.roomTransactions.clear();
    this.playerNotifications.clear();
    // TimerManager를 통한 모든 타이머 정리
    timerManager.clearAll();
  }
}

export const store = new Store();
