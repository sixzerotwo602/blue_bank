import React, { useEffect, useState } from 'react';
import type { Vote, Player } from '@blue-banker/shared';

interface Props {
  vote: Vote | null;
  players: Player[];
  currentUserId?: string;
  onCastVote: (voteId: string, approve: boolean) => void;
  onCancelVote?: (voteId: string) => void; // T048: 취소 콜백
}

/**
 * T059-T061: GameEndVotePopup 컴포넌트
 * 게임 종료 투표 팝업 - 투표 진행 상황 및 카운트다운 표시
 */
export const GameEndVotePopup: React.FC<Props> = ({
  vote,
  players,
  currentUserId,
  onCastVote,
  onCancelVote,
}) => {
  const [remainingTime, setRemainingTime] = useState(60);

  // T061: 남은 시간 카운트다운
  useEffect(() => {
    if (!vote || vote.status !== 'IN_PROGRESS') return;

    const updateTimer = () => {
      if (!vote.expiresAt) return;
      const remaining = Math.max(0, Math.ceil((vote.expiresAt - Date.now()) / 1000));
      setRemainingTime(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [vote]);

  if (!vote || vote.status !== 'IN_PROGRESS') return null;

  const hasVoted = vote.votes && currentUserId && currentUserId in vote.votes;
  const requesterName = players.find(p => p.id === vote.requesterId)?.nickname || '호스트';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-slate-900 border border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-red-900/50 bg-gradient-to-r from-red-900/50 to-orange-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span className="animate-pulse">🚨</span>
            게임 종료 투표
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-slate-400 mb-1">호스트 <span className="text-white font-bold">{requesterName}</span>님이</div>
            <div className="text-white text-lg font-bold">게임 종료를 요청했습니다</div>
          </div>

          {/* T061: 남은 시간 카운트다운 */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-sm mb-1">남은 시간</div>
            <div className={`text-4xl font-mono font-bold ${remainingTime <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {remainingTime}초
            </div>
            <div className="text-slate-500 text-xs mt-1">시간 초과 시 자동으로 동의 처리됩니다</div>
          </div>

          {/* T060: 투표 진행 상황 */}
          <div className="bg-slate-800/50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-2">플레이어 응답 현황</div>
            <div className="space-y-1.5">
              {players.map((player) => {
                const playerVote = vote.votes?.[player.id];
                const hasPlayerVoted = player.id in (vote.votes || {});
                
                return (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      hasPlayerVoted 
                        ? playerVote ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'
                        : 'bg-slate-700/50 border border-slate-600'
                    }`}
                  >
                    <span className="text-white">{player.nickname}</span>
                    <span className={`text-sm font-bold ${
                      hasPlayerVoted 
                        ? playerVote ? 'text-green-400' : 'text-red-400'
                        : 'text-slate-400'
                    }`}>
                      {hasPlayerVoted 
                        ? playerVote ? '✓ 동의' : '✗ 반대'
                        : '⏳ 대기'
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 투표 버튼 */}
          {!hasVoted && currentUserId !== vote.requesterId && (
            <div className="flex gap-2">
              <button
                onClick={() => onCastVote(vote.id, false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-bold transition-colors text-slate-300"
              >
                반대
              </button>
              <button
                onClick={() => onCastVote(vote.id, true)}
                className="flex-1 bg-green-600 hover:bg-green-500 p-4 rounded-xl font-bold transition-colors"
              >
                동의
              </button>
            </div>
          )}

          {hasVoted && (
            <div className="text-center text-slate-400 py-2">
              투표 완료! 다른 플레이어의 응답을 기다리는 중...
            </div>
          )}

          {/* T048-T050: 호스트(요청자)만 취소 버튼 표시 */}
          {currentUserId === vote.requesterId && onCancelVote && (
            <button
              onClick={() => onCancelVote(vote.id)}
              className="w-full bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold transition-colors text-slate-300 mt-2"
            >
              투표 취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
