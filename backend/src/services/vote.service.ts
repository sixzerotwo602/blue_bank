import type { Vote, VoteStatus } from '@blue-banker/shared';
import { store } from '../models/store.js';
import { randomUUID } from 'crypto';
import { transactionService } from './transaction.service.js';

export class VoteService {
  
  createVote(roomId: string, requesterId: string, amount: number): Vote {
    const room = store.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    if (room.welfareFund < amount) {
        throw new Error('Insufficient welfare fund');
    }
    
    // Check if active vote exists for this room?
    // For simplicity, allow multiple or just check if this user has one.
    // Let's assume one active vote per room for now to avoid UI clutter.
    const activeVote = Array.from(store.votes.values()).find(
        v => v.roomId === roomId && v.status === 'IN_PROGRESS'
    );
    if (activeVote) {
        throw new Error('A vote is already in progress');
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
    if (!vote) throw new Error('Vote not found');

    if (vote.status !== 'IN_PROGRESS') {
        throw new Error('Vote is closed');
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
    
    if (status === 'APPROVED') {
        // Execute transaction
        try {
            transactionService.processTransaction(vote.roomId, vote.requesterId, {
                type: 'WELFARE_RECEIVE',
                amount: vote.amount
            });
        } catch (e) {
            console.error('Failed to process welfare transaction', e);
            // Ideally revert vote status or mark error, but for MVP just log
        }
    }
  }
}

export const voteService = new VoteService();
