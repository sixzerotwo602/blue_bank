import React, { useEffect, useState } from 'react';
import type { Vote, Player, BankReceiveReason } from '@blue-banker/shared';
import { MoneyDisplay } from '../../../ui';

interface Props {
  vote: Vote | null;
  players: Player[];
  currentUserId?: string;
  onCastVote: (voteId: string, approve: boolean) => void;
}

// 사유 라벨 매핑
const REASON_LABELS: Record<BankReceiveReason | string, { label: string; icon: string }> = {
  LOTTERY: { label: '복권 당첨', icon: '🎰' },
  PRIZE: { label: '우승 상금', icon: '🏆' },
  BONUS: { label: '보너스', icon: '🎁' },
  OTHER: { label: '기타', icon: '💰' },
};

/**
 * Task 5.4: BankReceiveVotePopup 컴포넌트
 * 은행 수령 투표 팝업 - 투표 진행 상황 및 카운트다운 표시
 */
export const BankReceiveVotePopup: React.FC<Props> = ({
  vote,
  players,
  currentUserId,
  onCastVote,
}) => {
  const [remainingTime, setRemainingTime] = useState(60);

  // 남은 시간 카운트다운
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

  // ESC 키로 닫히지 않도록 방지
  useEffect(() => {
    if (!vote || vote.status !== 'IN_PROGRESS') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [vote]);

  if (!vote || vote.status !== 'IN_PROGRESS') return null;

  const hasVoted = vote.votes && currentUserId && currentUserId in vote.votes;
  const requester = players.find(p => p.id === vote.requesterId);
  const requesterName = requester?.nickname || '플레이어';
  const reasonInfo = REASON_LABELS[vote.reason || 'OTHER'] || REASON_LABELS.OTHER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-slate-900 border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-amber-900/50 bg-gradient-to-r from-amber-900/50 to-orange-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>🏦</span>
            은행 수령 투표
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">{reasonInfo.icon}</div>
            <div className="text-slate-400 mb-1">
              <span className="text-white font-bold">{requesterName}</span>님이
            </div>
            <div className="text-white text-lg font-bold mb-2">
              은행에서 돈 받기를 요청했습니다
            </div>
            <div className="text-amber-400 text-2xl font-bold">
              <MoneyDisplay amount={vote.amount || 0} />
            </div>
            <div className="text-slate-400 text-sm mt-1">
              사유: {reasonInfo.label}
              {vote.reason && !REASON_LABELS[vote.reason] && ` (${vote.reason})`}
            </div>
          </div>

          {/* 남은 시간 카운트다운 */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-sm mb-1">남은 시간</div>
            <div className={`text-4xl font-mono font-bold ${remainingTime <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {remainingTime}초
            </div>
            <div className="text-slate-500 text-xs mt-1">시간 초과 시 미응답은 거절로 처리됩니다</div>
          </div>

          {/* 투표 진행 상황 */}
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
                    <span className="text-white">
                      {player.nickname}
                      {player.id === vote.requesterId && <span className="text-amber-400 text-xs ml-1">(요청자)</span>}
                    </span>
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

          {/* 투표 버튼 - 요청자 제외 */}
          {!hasVoted && currentUserId !== vote.requesterId && (
            <div className="flex gap-2">
              <button
                onClick={() => onCastVote(vote.id, false)}
                className="flex-1 bg-red-600 hover:bg-red-500 p-4 rounded-xl font-bold transition-colors text-white shadow-lg shadow-red-900/20 active:scale-95"
              >
                ✗ 반대
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
        </div>
      </div>
    </div>
  );
};
