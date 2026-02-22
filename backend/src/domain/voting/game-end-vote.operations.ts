import type { GameEndVote, Room } from '@blue-banker/shared';
import { randomUUID } from 'crypto';
import { VOTE_TIMEOUT_MS } from '../../utils/constants.js';

/**
 * 게임종료 투표 순수 함수
 */

export function createGameEndVote(roomId: string, requesterId: string, room: Room): GameEndVote {
  if (room.hostId !== requesterId) {
    throw new Error('호스트만 게임 종료를 요청할 수 있습니다');
  }

  const vote: GameEndVote = {
    id: randomUUID(),
    roomId,
    requesterId,
    status: 'IN_PROGRESS',
    votes: {},
    createdAt: Date.now(),
    expiresAt: Date.now() + VOTE_TIMEOUT_MS,
    timeoutHandledAs: 'REJECT'
  };

  // 호스트는 자동으로 찬성
  vote.votes[requesterId] = true;

  return vote;
}

export function castGameEndVote(vote: GameEndVote, voterId: string, approve: boolean, totalPlayers: number): GameEndVote {
  if (vote.status !== 'IN_PROGRESS') {
    throw new Error('투표가 종료되었습니다');
  }

  vote.votes[voterId] = approve;
  checkGameEndVoteOutcome(vote, totalPlayers);
  return vote;
}

export function processGameEndVoteTimeout(vote: GameEndVote, room: Room): GameEndVote {
  if (vote.status !== 'IN_PROGRESS') return vote;

  // 미응답 플레이어는 거절로 처리
  for (const player of room.players) {
    if (vote.votes[player.id] === undefined || vote.votes[player.id] === null) {
      vote.votes[player.id] = false;
    }
  }

  checkGameEndVoteOutcome(vote, room.players.length);
  return vote;
}

export function cancelGameEndVote(vote: GameEndVote, requesterId: string): GameEndVote {
  if (vote.status !== 'IN_PROGRESS') {
    throw new Error('투표가 이미 종료되었습니다');
  }

  if (vote.requesterId !== requesterId) {
    throw new Error('투표 요청자만 취소할 수 있습니다');
  }

  vote.status = 'CANCELLED';
  return vote;
}

function checkGameEndVoteOutcome(vote: GameEndVote, totalPlayers: number): void {
  const votesCast = Object.keys(vote.votes).length;
  const approvals = Object.values(vote.votes).filter(v => v).length;

  // 전원 동의 시 종료
  if (approvals === totalPlayers) {
    vote.status = 'APPROVED';
  } else if (votesCast === totalPlayers) {
    vote.status = 'REJECTED';
  }
}
