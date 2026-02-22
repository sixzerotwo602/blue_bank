import type { Vote, GameEndVote, Room, BankReceiveReason } from '@blue-banker/shared';
import type { IVoteRepository } from '../domain/voting/vote.repository.js';
import type { TransactionUseCases } from './transaction.use-cases.js';
import { createWelfareVote, createBankReceiveVote, castVote, processVoteTimeout } from '../domain/voting/vote.operations.js';
import { createGameEndVote, castGameEndVote, processGameEndVoteTimeout, cancelGameEndVote } from '../domain/voting/game-end-vote.operations.js';
import { timerManager } from '../utils/timer-manager.js';

export class VotingUseCases {
  private transactionUC!: TransactionUseCases;

  constructor(private readonly voteRepo: IVoteRepository) {}

  /** 순환 참조 방지를 위해 setter로 주입 */
  setTransactionUseCases(txUC: TransactionUseCases): void {
    this.transactionUC = txUC;
  }

  // ─── 복지기금 투표 ───

  startWelfareVote(room: Room, requesterId: string): Vote {
    const activeVote = this.voteRepo.findActiveVoteByRoomId(room.id);
    if (activeVote) {
      throw new Error('이미 투표가 진행 중입니다');
    }

    const fullAmount = room.welfareFund;
    if (fullAmount <= 0) throw new Error('복지기금이 없습니다.');

    const vote = createWelfareVote(room.id, requesterId, fullAmount, room);
    this.voteRepo.saveVote(vote);
    return vote;
  }

  // ─── 은행 수령 투표 ───

  startBankReceiveVote(room: Room, requesterId: string, amount: number, reason: BankReceiveReason, customReason?: string): Vote {
    const activeVote = this.voteRepo.findActiveVoteByRoomId(room.id);
    if (activeVote) {
      throw new Error('이미 투표가 진행 중입니다');
    }

    const vote = createBankReceiveVote(room.id, requesterId, amount, reason, customReason);
    this.voteRepo.saveVote(vote);
    return vote;
  }

  // ─── 투표 캐스트 (복지기금/은행수령 공용) ───

  castVote(voteId: string, voterId: string, approve: boolean, room: Room): Vote {
    const vote = this.voteRepo.findVoteById(voteId);
    if (!vote) throw new Error('투표를 찾을 수 없습니다');

    castVote(vote, voterId, approve, room.players.length);

    // 투표 종료 시 승인 처리
    if (vote.status === 'APPROVED') {
      timerManager.clear(`${vote.roomId}:vote:${vote.id}`);
      this.processVoteApproval(vote, room);
    } else if (vote.status === 'REJECTED') {
      timerManager.clear(`${vote.roomId}:vote:${vote.id}`);
    }

    return vote;
  }

  handleVoteTimeout(vote: Vote, room: Room): Vote {
    processVoteTimeout(vote, room);

    if (vote.status === 'APPROVED') {
      this.processVoteApproval(vote, room);
    }

    return vote;
  }

  private processVoteApproval(vote: Vote, room: Room): void {
    if (vote.voteType === 'BANK_RECEIVE') {
      try {
        this.transactionUC.process(room, vote.requesterId, {
          type: 'BANK_RECEIVE',
          amount: vote.amount,
          reason: vote.reason as string
        });
      } catch (e) {
        console.error('Failed to process bank receive transaction', e);
      }
    } else {
      try {
        this.transactionUC.process(room, vote.requesterId, {
          type: 'WELFARE_RECEIVE',
          amount: vote.amount
        });
      } catch (e) {
        console.error('Failed to process welfare transaction', e);
      }
    }
  }

  // ─── 게임 종료 투표 ───

  startGameEndVote(room: Room, requesterId: string): GameEndVote {
    const activeVote = this.voteRepo.findActiveGameEndVoteByRoomId(room.id);
    if (activeVote) {
      throw new Error('이미 게임 종료 투표가 진행 중입니다');
    }

    const vote = createGameEndVote(room.id, requesterId, room);
    this.voteRepo.saveGameEndVote(vote);
    return vote;
  }

  castGameEndVote(voteId: string, voterId: string, approve: boolean, room: Room): GameEndVote {
    const vote = this.voteRepo.findGameEndVoteById(voteId);
    if (!vote) throw new Error('투표를 찾을 수 없습니다');

    castGameEndVote(vote, voterId, approve, room.players.length);
    return vote;
  }

  handleGameEndVoteTimeout(voteId: string, room: Room): GameEndVote | null {
    const vote = this.voteRepo.findGameEndVoteById(voteId);
    if (!vote || vote.status !== 'IN_PROGRESS') return null;

    processGameEndVoteTimeout(vote, room);
    return vote;
  }

  cancelGameEndVote(voteId: string, requesterId: string): GameEndVote {
    const vote = this.voteRepo.findGameEndVoteById(voteId);
    if (!vote) throw new Error('투표를 찾을 수 없습니다');

    cancelGameEndVote(vote, requesterId);
    return vote;
  }

  getActiveVote(roomId: string): Vote | undefined {
    return this.voteRepo.findActiveVoteByRoomId(roomId);
  }
}
