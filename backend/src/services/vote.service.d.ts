import type { Vote } from '@blue-banker/shared';
export declare class VoteService {
    createVote(roomId: string, requesterId: string, amount: number): Vote;
    castVote(voteId: string, voterId: string, approve: boolean): Vote;
    private checkVoteOutcome;
    private finalizeVote;
}
export declare const voteService: VoteService;
//# sourceMappingURL=vote.service.d.ts.map