import { memoryStore } from '../infrastructure/persistence/memory-store.js';
import { NotificationRepositoryImpl } from '../infrastructure/persistence/notification.repository.impl.js';
import { VoteRepositoryImpl } from '../infrastructure/persistence/vote.repository.impl.js';
import { TransactionRepositoryImpl } from '../infrastructure/persistence/transaction.repository.impl.js';
import { RoomRepositoryImpl } from '../infrastructure/persistence/room.repository.impl.js';
import { SessionRepositoryImpl } from '../infrastructure/persistence/session.repository.impl.js';
import { NotificationUseCases } from './notification.use-cases.js';
import { VotingUseCases } from './voting.use-cases.js';
import { TransactionUseCases } from './transaction.use-cases.js';
import { GameUseCases } from './game.use-cases.js';
import { timerManager } from '../utils/timer-manager.js';

/**
 * 수동 DI 컨테이너
 */

// Repositories
const notificationRepo = new NotificationRepositoryImpl(memoryStore);
const voteRepo = new VoteRepositoryImpl(memoryStore);
const transactionRepo = new TransactionRepositoryImpl(memoryStore);
const roomRepo = new RoomRepositoryImpl(memoryStore);
const sessionRepo = new SessionRepositoryImpl(memoryStore);

// 방 정리 함수 (모든 관련 데이터 삭제)
function cleanupRoom(roomId: string): void {
  const room = memoryStore.rooms.get(roomId);
  if (!room) return;

  for (const player of room.players) {
    memoryStore.playerToRoom.delete(player.id);
    const notifIds = memoryStore.playerNotifications.get(player.id);
    if (notifIds) {
      for (const notifId of notifIds) {
        memoryStore.notifications.delete(notifId);
      }
      memoryStore.playerNotifications.delete(player.id);
    }
  }

  const txIds = memoryStore.roomTransactions.get(roomId);
  if (txIds) {
    for (const txId of txIds) {
      memoryStore.transactions.delete(txId);
    }
    memoryStore.roomTransactions.delete(roomId);
  }

  for (const [voteId, vote] of memoryStore.votes.entries()) {
    if (vote.roomId === roomId) {
      memoryStore.votes.delete(voteId);
    }
  }

  for (const [voteId, vote] of memoryStore.gameEndVotes.entries()) {
    if (vote.roomId === roomId) {
      memoryStore.gameEndVotes.delete(voteId);
    }
  }

  for (const [requestId, request] of memoryStore.cancelRequests.entries()) {
    const tx = memoryStore.transactions.get(request.transactionId);
    if (!tx) {
      memoryStore.cancelRequests.delete(requestId);
    }
  }

  for (const [key, session] of memoryStore.disconnectedSessions.entries()) {
    if (session.roomId === roomId) {
      memoryStore.disconnectedSessions.delete(key);
    }
  }

  memoryStore.roomCreatorIps.delete(roomId);
  memoryStore.rooms.delete(roomId);
  timerManager.clearByPrefix(`${roomId}:`);
}

// Use Cases
export const notificationUseCases = new NotificationUseCases(notificationRepo);
export const transactionUseCases = new TransactionUseCases(transactionRepo);
export const votingUseCases = new VotingUseCases(voteRepo);
export const gameUseCases = new GameUseCases(roomRepo, sessionRepo, cleanupRoom);

// 순환 의존 해결: VotingUseCases → TransactionUseCases
votingUseCases.setTransactionUseCases(transactionUseCases);
