import type { Vote, GameEndVote } from '@blue-banker/shared';

export interface IVoteRepository {
  saveVote(vote: Vote): void;
  findVoteById(id: string): Vote | undefined;
  findActiveVoteByRoomId(roomId: string): Vote | undefined;

  saveGameEndVote(vote: GameEndVote): void;
  findGameEndVoteById(id: string): GameEndVote | undefined;
  findActiveGameEndVoteByRoomId(roomId: string): GameEndVote | undefined;
}
