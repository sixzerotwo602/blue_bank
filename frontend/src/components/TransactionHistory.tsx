import React from 'react';
import type { Transaction } from '@blue-banker/shared';
import { formatManwon } from '../utils/formatMoney';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentUserId?: string;
  players: { id: string; nickname: string }[];
}

// T024: 거래 유형별 한글 표시
const getTransactionTypeLabel = (type: string): string => {
  switch (type) {
    case 'TRANSFER': return '송금';
    case 'BUY_ASSET': return '부동산 매입';
    case 'PAY_COST': return '은행 납부';
    case 'DONATE': return '복지기금 기부';
    case 'SALARY': return '월급 수령';
    case 'WELFARE_RECEIVE': return '복지기금 수령';
    case 'BANK_RECEIVE': return '은행 수령';
    case 'SELL_ASSET': return '자산 매각';
    default: return type;
  }
};

// 거래 유형별 아이콘
const getTransactionIcon = (type: string): string => {
  switch (type) {
    case 'TRANSFER': return '💸';
    case 'BUY_ASSET': return '🏠';
    case 'PAY_COST': return '🏦';
    case 'DONATE': return '🤝';
    case 'SALARY': return '💵';
    case 'WELFARE_RECEIVE': return '🎁';
    case 'BANK_RECEIVE': return '🎰';
    case 'SELL_ASSET': return '📤';
    default: return '📋';
  }
};

export const TransactionHistory: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  transactions,
  currentUserId,
  players
}) => {
  if (!isOpen) return null;

  const getPlayerName = (id: string): string => {
    if (id === 'BANK') return '은행';
    if (id === 'FUND') return '복지기금';
    const player = players.find(p => p.id === id);
    return player?.nickname || id.slice(-4);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 내가 받은/보낸 거래인지 판단
  const isReceived = (tx: Transaction): boolean => {
    return tx.toId === currentUserId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 pt-8 sm:pt-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in my-auto max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
           <h3 className="font-bold text-lg text-white">📋 거래 내역</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {transactions.length === 0 ? (
            // T027: 빈 거래 내역 시 안내 메시지
            <div className="text-center text-slate-500 py-8">
              <div className="text-4xl mb-2">📭</div>
              <p>거래 내역이 없습니다.</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const received = isReceived(tx);
              return (
                <div 
                  key={tx.id}
                  className={`p-3 rounded-xl border ${
                    received 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {getTransactionTypeLabel(tx.type)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {received ? (
                            <span>From: {getPlayerName(tx.fromId)}</span>
                          ) : (
                            <span>To: {getPlayerName(tx.toId)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${received ? 'text-green-400' : 'text-red-400'}`}>
                        {received ? '+' : '-'}{formatManwon(tx.amount)}
                      </div>
                      <div className="text-xs text-slate-600">
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  {tx.description && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                      {tx.description}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
