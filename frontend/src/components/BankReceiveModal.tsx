import React, { useState } from 'react';
import type { BankReceiveReason } from '@blue-banker/shared';
import { formatManwon } from '../utils/formatMoney';
import { MAX_AMOUNT } from '../utils/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: BankReceiveReason) => void;
  currentUserId?: string;
  currentUserNickname?: string;
}

const REASONS: { value: BankReceiveReason; label: string; icon: string }[] = [
  { value: 'LOTTERY', label: '복권 당첨', icon: '🎰' },
  { value: 'PRIZE', label: '우승 상금', icon: '🏆' },
  { value: 'BONUS', label: '보너스', icon: '🎁' },
  { value: 'OTHER', label: '기타', icon: '💰' },
];

/**
 * T012-T013: BankReceiveModal 컴포넌트 (개인화)
 * 모든 플레이어가 직접 본인 계좌로 은행 수령 가능
 * 플레이어 선택 UI 제거됨
 */
export const BankReceiveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUserId: _currentUserId,
  currentUserNickname,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<BankReceiveReason>('OTHER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > MAX_AMOUNT) return;
    onSubmit(amount, reason);
    // Reset form
    setAmount(0);
    setReason('OTHER');
    onClose();
  };

  const adjustAmount = (delta: number) => {
    setAmount(prev => Math.max(0, Math.min(MAX_AMOUNT, prev + delta)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-amber-900/50 to-orange-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>🏦</span>
            은행 수령
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* T012: 플레이어 선택 UI 제거 - 본인 계좌 표시 */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">수령 계좌</div>
            <div className="text-lg font-semibold text-white">
              {currentUserNickname || '나'} (본인)
            </div>
          </div>

          {/* 사유 선택 */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">지급 사유</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                    reason === r.value
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span className="text-sm">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 금액 입력 */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">지급 금액</label>
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="text-2xl font-bold text-amber-400 text-center mb-3">
                {formatManwon(amount)}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[50000, 10000, 5000, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => adjustAmount(val)}
                    className="px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                  >
                    +{val >= 10000 ? `${val / 10000}만` : `${val / 1000}천`}
                  </button>
                ))}
                {[50000, 10000, 5000, 1000].map((val) => (
                  <button
                    key={`-${val}`}
                    type="button"
                    onClick={() => adjustAmount(-val)}
                    className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-red-400 transition-colors"
                  >
                    -{val >= 10000 ? `${val / 10000}만` : `${val / 1000}천`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={amount <= 0}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 p-4 rounded-xl font-bold transition-colors"
          >
            수령하기
          </button>
        </form>
      </div>
    </div>
  );
};
