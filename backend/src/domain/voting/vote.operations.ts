import type { Vote, VoteStatus, Room, BankReceiveReason } from '@blue-banker/shared';
import { randomUUID } from 'crypto';
import { VOTE_TIMEOUT_MS } from '../../utils/constants.js';

/**
 * 복지기금/은행수령 투표 순수 함수
 */

export function createWelfareVote(roomId: string, requesterId: string, amount: number, room: Room): Vote {
  if (room.welfareFund < amount) {
    throw new Error('복지기금이 부족합니다');
  }

  const vote: Vote = {
    id: randomUUID(),
    roomId,
    requesterId,
    amount,
    status: 'IN_PROGRESS',
    votes: {},
    createdAt: Date.now(),
    expiresAt: Date.now() + VOTE_TIMEOUT_MS
  };

  // 요청자는 자동으로 찬성
  vote.votes[requesterId] = true;

  return vote;
}

export function createBankReceiveVote(
  roomId: string,
  requesterId: string,
  amount: number,
  reason: BankReceiveReason,
  customReason?: string
): Vote {
  const vote: Vote = {
    id: randomUUID(),
    roomId,
    requesterId,
    voteType: 'BANK_RECEIVE',
    amount,
    status: 'IN_PROGRESS',
    votes: {},
    createdAt: Date.now(),
    expiresAt: Date.now() + VOTE_TIMEOUT_MS,
    timeoutHandledAs: 'REJECT',
    reason: reason === 'OTHER' ? (customReason || 'OTHER') : reason
  };

  // 요청자는 자동으로 찬성
  vote.votes[requesterId] = true;

  return vote;
}

export function castVote(vote: Vote, voterId: string, approve: boolean, totalPlayers: number): Vote {
  if (vote.status !== 'IN_PROGRESS') {
    throw new Error('투표가 종료되었습니다');
  }

  vote.votes[voterId] = approve;
  checkVoteOutcome(vote, totalPlayers);
  return vote;
}

export function processVoteTimeout(vote: Vote, room: Room): Vote {
  if (vote.status !== 'IN_PROGRESS') return vote;

  // 미응답 플레이어는 거절로 처리
  for (const player of room.players) {
    if (!(player.id in vote.votes)) {
      vote.votes[player.id] = false;
    }
  }

  checkVoteOutcome(vote, room.players.length);
  return vote;
}

function checkVoteOutcome(vote: Vote, totalPlayers: number): void {
  const votesCast = Object.keys(vote.votes).length;
  const approvals = Object.values(vote.votes).filter(v => v).length;
  const rejections = votesCast - approvals;
  const threshold = totalPlayers / 2;

  if (approvals > threshold) {
    finalizeVote(vote, 'APPROVED');
  } else if (rejections >= threshold && votesCast === totalPlayers) {
    finalizeVote(vote, 'REJECTED');
  } else if (votesCast === totalPlayers) {
    finalizeVote(vote, 'REJECTED');
  }
}

function finalizeVote(vote: Vote, status: VoteStatus): void {
  vote.status = status;
}
