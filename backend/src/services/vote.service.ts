import type { Vote, VoteStatus, GameEndVote, BankReceiveReason } from '@blue-banker/shared';
import { store } from '../models/store.js';
import { randomUUID } from 'crypto';
import { transactionService } from './transaction.service.js';

export class VoteService {
  
  createVote(roomId: string, requesterId: string, amount: number): Vote {
    const room = store.rooms.get(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다');

    if (room.welfareFund < amount) {
        throw new Error('복지기금이 부족합니다');
    }
    
    // Check if active vote exists for this room?
    // For simplicity, allow multiple or just check if this user has one.
    // Let's assume one active vote per room for now to avoid UI clutter.
    const activeVote = Array.from(store.votes.values()).find(
        v => v.roomId === roomId && v.status === 'IN_PROGRESS'
    );
    if (activeVote) {
        throw new Error('이미 투표가 진행 중입니다');
    }

    const vote: Vote = {
      id: randomUUID(),
      roomId,
      requesterId,
      amount,
      status: 'IN_PROGRESS',
      votes: {},
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000 // 1 min timeout?
    };

    // Auto-vote yes for requester? Usually yes.
    vote.votes[requesterId] = true;

    store.votes.set(vote.id, vote);
    return vote;
  }

  castVote(voteId: string, voterId: string, approve: boolean): Vote {
    const vote = store.votes.get(voteId);
    if (!vote) throw new Error('투표를 찾을 수 없습니다');

    if (vote.status !== 'IN_PROGRESS') {
        throw new Error('투표가 종료되었습니다');
    }

    vote.votes[voterId] = approve;
    
    // Check outcome
    this.checkVoteOutcome(vote);

    return vote;
  }

  private checkVoteOutcome(vote: Vote) {
    const room = store.rooms.get(vote.roomId);
    if (!room) return; // Should not happen

    const totalPlayers = room.players.length;
    const votesCast = Object.keys(vote.votes).length;
    const approvals = Object.values(vote.votes).filter(v => v).length;
    const rejections = votesCast - approvals;

    // Logic: 
    // If majority approved (> Total/2), PASS
    // If majority rejected (>= Total/2 ? or >?), FAIL
    // If all voted, finalize.
    
    const threshold = totalPlayers / 2;

    if (approvals > threshold) {
        this.finalizeVote(vote, 'APPROVED');
    } else if (rejections >= threshold && votesCast === totalPlayers) { // Tie is reject? Or if rejections > threshold
        // If rejections are already enough to prevent approval
        // If total 4, threshold 2. approved > 2 -> 3.
        // If 2 reject, max approve is 2. 2 is not > 2. So reject.
        // If rejections >= (totalPlayers - threshold), essentially logic for impossible to win
         this.finalizeVote(vote, 'REJECTED');
    } else if (votesCast === totalPlayers) {
        // All voted, but didn't pass approval check above (so tie or less)
        this.finalizeVote(vote, 'REJECTED');
    }
  }

  private finalizeVote(vote: Vote, status: VoteStatus) {
    vote.status = status;

    // 타임아웃 타이머 정리
    const timeoutId = store.voteTimeouts.get(vote.id);
    if (timeoutId) {
        clearTimeout(timeoutId);
        store.voteTimeouts.delete(vote.id);
    }

    if (status === 'APPROVED') {
        // Task 5.1: 투표 유형에 따라 분기 처리
        if (vote.voteType === 'BANK_RECEIVE') {
            // 은행 수령 투표 승인
            try {
                transactionService.processTransaction(vote.roomId, vote.requesterId, {
                    type: 'BANK_RECEIVE',
                    amount: vote.amount,
                    reason: vote.reason as string
                });
            } catch (e) {
                console.error('Failed to process bank receive transaction', e);
            }
        } else {
            // 기존 복지기금 투표 처리
            try {
                transactionService.processTransaction(vote.roomId, vote.requesterId, {
                    type: 'WELFARE_RECEIVE',
                    amount: vote.amount
                });
            } catch (e) {
                console.error('Failed to process welfare transaction', e);
            }
        }
    }
  }

  // FR-023: 사회복지기금 투표 타임아웃 처리 (미응답 = 거절)
  processWelfareVoteTimeout(voteId: string): Vote | null {
    const vote = store.votes.get(voteId);
    if (!vote || vote.status !== 'IN_PROGRESS') return null;

    const room = store.rooms.get(vote.roomId);
    if (!room) return null;

    // FR-023: 미응답 플레이어는 거절로 처리
    for (const player of room.players) {
        if (!(player.id in vote.votes)) {
            vote.votes[player.id] = false;
        }
    }

    this.checkVoteOutcome(vote);
    return vote;
  }

  // 진행 중인 투표 조회 (은행 수령 투표용)
  getActiveVote(roomId: string): Vote | undefined {
    return Array.from(store.votes.values()).find(
        v => v.roomId === roomId && v.status === 'IN_PROGRESS'
    );
  }

  // Task 5.1: 은행 수령 투표 생성
  createBankReceiveVote(roomId: string, requesterId: string, amount: number, reason: BankReceiveReason, customReason?: string): Vote {
    const room = store.rooms.get(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다');

    // 이미 진행 중인 투표가 있는지 확인
    const activeVote = this.getActiveVote(roomId);
    if (activeVote) {
        throw new Error('이미 투표가 진행 중입니다');
    }

    const vote: Vote = {
      id: randomUUID(),
      roomId,
      requesterId,
      voteType: 'BANK_RECEIVE',
      amount,
      status: 'IN_PROGRESS',
      votes: {},
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
      timeoutHandledAs: 'REJECT',
      reason: reason === 'OTHER' ? (customReason || 'OTHER') : reason
    };

    // 요청자는 자동으로 찬성
    vote.votes[requesterId] = true;

    store.votes.set(vote.id, vote);
    return vote;
  }

  // T053: 게임 종료 투표 시작
  createGameEndVote(roomId: string, requesterId: string): GameEndVote {
    const room = store.rooms.get(roomId);
    if (!room) throw new Error('방을 찾을 수 없습니다');

    // 호스트만 시작 가능
    if (room.hostId !== requesterId) {
        throw new Error('호스트만 게임 종료를 요청할 수 있습니다');
    }

    // 이미 게임 종료 투표가 진행 중인지 확인
    const activeVote = Array.from(store.gameEndVotes.values()).find(
        v => v.roomId === roomId && v.status === 'IN_PROGRESS'
    );
    if (activeVote) {
        throw new Error('이미 게임 종료 투표가 진행 중입니다');
    }

    const vote: GameEndVote = {
      id: randomUUID(),
      roomId,
      requesterId,
      status: 'IN_PROGRESS',
      votes: {},
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000, // T054: 60초 타임아웃
      timeoutHandledAs: 'REJECT'  // FR-009-1: 미응답 시 거절로 처리 (기존 'APPROVE'에서 변경)
    };

    // 호스트는 자동으로 찬성
    vote.votes[requesterId] = true;

    store.gameEndVotes.set(vote.id, vote);
    return vote;
  }

  // T057: 게임 종료 투표 처리
  castGameEndVote(voteId: string, voterId: string, approve: boolean): GameEndVote {
    const vote = store.gameEndVotes.get(voteId);
    if (!vote) throw new Error('투표를 찾을 수 없습니다');

    if (vote.status !== 'IN_PROGRESS') {
        throw new Error('투표가 종료되었습니다');
    }

    vote.votes[voterId] = approve;
    
    // T055: 결과 집계 - 전원 동의 시 종료
    this.checkGameEndVoteOutcome(vote);

    return vote;
  }

  // T054: 타임아웃 처리 (FR-009-1: 미응답=거절로 변경)
  processGameEndVoteTimeout(voteId: string): GameEndVote | null {
    const vote = store.gameEndVotes.get(voteId);
    if (!vote || vote.status !== 'IN_PROGRESS') return null;

    const room = store.rooms.get(vote.roomId);
    if (!room) return null;

    // FR-009-1: 미응답 플레이어는 거절로 처리 (기존 동의에서 변경)
    for (const player of room.players) {
        if (vote.votes[player.id] === undefined || vote.votes[player.id] === null) {
            vote.votes[player.id] = false;  // REJECT
        }
    }

    this.checkGameEndVoteOutcome(vote);
    return vote;
  }

  // T055: 게임 종료 투표 결과 집계
  private checkGameEndVoteOutcome(vote: GameEndVote) {
    const room = store.rooms.get(vote.roomId);
    if (!room) return;

    const totalPlayers = room.players.length;
    const votesCast = Object.keys(vote.votes).length;
    const approvals = Object.values(vote.votes).filter(v => v).length;

    // 전원 동의 시 종료
    if (approvals === totalPlayers) {
        vote.status = 'APPROVED';
    } else if (votesCast === totalPlayers) {
        // 모두 투표했지만 반대가 있으면 거부
        vote.status = 'REJECTED';
    }
    // 아직 투표가 완료되지 않았으면 IN_PROGRESS 유지
  }

  // T046: 게임 종료 투표 취소 (호스트만 가능)
  cancelGameEndVote(voteId: string, requesterId: string): GameEndVote {
    const vote = store.gameEndVotes.get(voteId);
    if (!vote) throw new Error('투표를 찾을 수 없습니다');

    if (vote.status !== 'IN_PROGRESS') {
        throw new Error('투표가 이미 종료되었습니다');
    }

    // 투표 요청자만 취소 가능
    if (vote.requesterId !== requesterId) {
        throw new Error('투표 요청자만 취소할 수 있습니다');
    }

    vote.status = 'CANCELLED';  // 취소 상태로 변경 (REJECTED → CANCELLED)
    return vote;
  }
}

export const voteService = new VoteService();

