import React from 'react';
import type { Vote, Player } from '@blue-banker/shared';
import { MoneyDisplay } from '../../../ui/molecules/MoneyValue';

interface Props {
  vote: Vote;
  players: Player[];
  currentUserId?: string;
  onCastVote: (voteId: string, approve: boolean) => void;
}

export const VotePopup: React.FC<Props> = ({ vote, players, currentUserId, onCastVote }) => {
  const requester = players.find(p => p.id === vote.requesterId);
  const totalVotes = players.length;
  const currentVotes = Object.keys(vote.votes).length;
  const approvals = Object.values(vote.votes).filter(v => v).length;
  const rejections = currentVotes - approvals;

  // Has current user voted?
  const hasVoted = currentUserId ? vote.votes[currentUserId] !== undefined : false;
  const myVote = currentUserId ? vote.votes[currentUserId] : undefined;

  const isEnded = vote.status !== 'IN_PROGRESS';
  const resultText = vote.status === 'APPROVED' ? '승인됨' : vote.status === 'REJECTED' ? '부결됨' : '진행 중';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      
      <div className="relative bg-slate-900 border border-purple-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-purple-900/20 p-4 border-b border-purple-500/20 flex justify-between items-center">
            <h3 className="font-bold text-lg text-purple-300 flex items-center gap-2">
                🗳️ 복지기금 투표
            </h3>
            <div className={`px-2 py-0.5 rounded text-xs font-bold border ${isEnded ? (vote.status === 'APPROVED' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-red-500/50 bg-red-500/10 text-red-300') : 'border-blue-500/50 bg-blue-500/10 text-blue-300 animate-pulse'}`}>
                {resultText}
            </div>
        </div>

        <div className="p-6 text-center space-y-4">
            <div className="text-slate-300">
                <span className="font-bold text-white">{requester?.nickname || 'Unknown'}</span> 님이
                <br/>
                <span className="font-bold text-2xl text-purple-400 my-2 block">
                    <MoneyDisplay amount={vote.amount} />
                </span>
                수령을 요청했습니다.
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>찬성 {approvals}</span>
                    <span>반대 {rejections}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${(approvals / totalVotes) * 100}%` }} className="bg-green-500 transition-all duration-500" />
                    <div style={{ width: `${(rejections / totalVotes) * 100}%` }} className="bg-red-500 transition-all duration-500" />
                </div>
                <div className="text-xs text-slate-500 text-right">
                    {currentVotes} / {totalVotes} 명 투표
                </div>
            </div>

            {/* Actions for Voter */}
            {!isEnded && !hasVoted && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                        onClick={() => onCastVote(vote.id, true)}
                        className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                    >
                        O 찬성
                    </button>
                    <button 
                        onClick={() => onCastVote(vote.id, false)}
                        className="bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                    >
                        X 반대
                    </button>
                </div>
            )}

            {/* Status for Voted User */}
            {!isEnded && hasVoted && (
                <div className="text-slate-400 bg-slate-800/50 py-3 rounded-lg animate-pulse">
                    투표 완료! 다른 플레이어를 기다리는 중...
                    <div className="text-sm mt-1">
                        내 선택: <span className={myVote ? 'text-green-400' : 'text-red-400'}>{myVote ? '찬성' : '반대'}</span>
                    </div>
                </div>
            )}
            
            {/* Result Message */}
            {isEnded && (
                 <div className="text-slate-300">
                    투표가 종료되었습니다.
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
