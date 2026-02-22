import type { Vote, GameEndVote } from '@blue-banker/shared';
import type { IVoteRepository } from '../../domain/voting/vote.repository.js';
import type { MemoryStore } from './memory-store.js';

export class VoteRepositoryImpl implements IVoteRepository {
  constructor(private readonly store: MemoryStore) {}

  saveVote(vote: Vote): void {
    this.store.votes.set(vote.id, vote);
  }

  findVoteById(id: string): Vote | undefined {
    return this.store.votes.get(id);
  }

  findActiveVoteByRoomId(roomId: string): Vote | undefined {
    return Array.from(this.store.votes.values()).find(
      v => v.roomId === roomId && v.status === 'IN_PROGRESS'
    );
  }

  saveGameEndVote(vote: GameEndVote): void {
    this.store.gameEndVotes.set(vote.id, vote);
  }

  findGameEndVoteById(id: string): GameEndVote | undefined {
    return this.store.gameEndVotes.get(id);
  }

  findActiveGameEndVoteByRoomId(roomId: string): GameEndVote | undefined {
    return Array.from(this.store.gameEndVotes.values()).find(
      v => v.roomId === roomId && v.status === 'IN_PROGRESS'
    );
  }
}
