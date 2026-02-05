import React, { useEffect, useState } from 'react';
import type { CancelRequest, Player, Transaction } from '@blue-banker/shared';
import { MoneyDisplay } from './MoneyDisplay';

interface Props {
  request: CancelRequest | null;
  players: Player[];
  transactions: Transaction[];
  onRespond: (requestId: string, approve: boolean) => void;
}

/**
 * Task 6.4: CancelRequestPopup 컴포넌트
 * 거래 취소 요청 모달 - 60초 타임아웃 표시
 */
export const CancelRequestPopup: React.FC<Props> = ({
  request,
  players,
  transactions,
  onRespond,
}) => {
  const [remainingTime, setRemainingTime] = useState(60);

  // 남은 시간 카운트다운
  useEffect(() => {
    if (!request || request.status !== 'PENDING') return;

    const updateTimer = () => {
      if (!request.expiresAt) return;
      const remaining = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
      setRemainingTime(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [request]);

  // ESC 키로 닫히지 않도록 방지
  useEffect(() => {
    if (!request || request.status !== 'PENDING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [request]);

  if (!request || request.status !== 'PENDING') return null;

  const requester = players.find(p => p.id === request.requesterId);
  const requesterName = requester?.nickname || '플레이어';
  const transaction = transactions.find(t => t.id === request.transactionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-slate-900 border border-orange-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-orange-900/50 bg-gradient-to-r from-orange-900/50 to-red-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>❌</span>
            거래 취소 요청
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-slate-400 mb-1">
              <span className="text-white font-bold">{requesterName}</span>님이
            </div>
            <div className="text-white text-lg font-bold mb-2">
              거래 취소를 요청했습니다
            </div>
            {transaction && (
              <div className="text-orange-400 text-2xl font-bold">
                <MoneyDisplay amount={transaction.amount} />
              </div>
            )}
          </div>

          {/* 거래 정보 */}
          {transaction && (
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-2">거래 정보</div>
              <div className="text-white">
                {transaction.description || `${requesterName}님으로부터의 송금`}
              </div>
            </div>
          )}

          {/* 남은 시간 카운트다운 */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-sm mb-1">남은 응답 시간</div>
            <div className={`text-4xl font-mono font-bold ${remainingTime <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {remainingTime}초
            </div>
            <div className="text-slate-500 text-xs mt-1">시간 초과 시 요청이 자동 만료됩니다</div>
          </div>

          {/* 안내 */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
            취소에 동의하면 받은 금액이 상대방에게 반환됩니다.
          </div>

          {/* 응답 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => onRespond(request.id, false)}
              className="flex-1 bg-red-600 hover:bg-red-500 p-4 rounded-xl font-bold transition-colors text-white shadow-lg shadow-red-900/20 active:scale-95"
            >
              ✗ 거절
            </button>
            <button
              onClick={() => onRespond(request.id, true)}
              className="flex-1 bg-orange-600 hover:bg-orange-500 p-4 rounded-xl font-bold transition-colors"
            >
              취소 동의
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
