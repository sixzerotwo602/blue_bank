import React from 'react';
import type { Transaction, TransactionType } from '@blue-banker/shared';
import { TRANSACTION_LABELS, TRANSACTION_ICONS } from '../utils/transactionLabels';
import { MoneyDisplay } from './MoneyDisplay';
import { formatManwon } from '../utils/formatMoney';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentUserId?: string;
  players: { id: string; nickname: string; cash?: number }[];
  onRequestCancel?: (transactionId: string) => void;
  welfareFund?: number; // 복지기금 잔액 (취소 가능 여부 판단용)
}

// T007-T008: transactionLabels.ts에서 가져온 상수 사용
const getTransactionTypeLabel = (type: TransactionType): string => {
  return TRANSACTION_LABELS[type] || type;
};

const getTransactionIcon = (type: TransactionType): string => {
  return TRANSACTION_ICONS[type] || '📋';
};

// T009: 거래 상세 정보 생성 함수
const getTransactionDetail = (
  tx: Transaction,
  getPlayerName: (id: string) => string
): string | null => {
  switch (tx.type) {
    case 'TRANSFER':
      return `${getPlayerName(tx.fromId)} → ${getPlayerName(tx.toId)}`;
    case 'BUY_ASSET':
      if (tx.description) {
        // description에 자산 정보가 포함됨 (영문 타입이 아닌 경우에만 표시)
        if (!isTransactionTypeString(tx.description)) {
          return tx.description;
        }
      }
      return null;
    case 'SELL_ASSET':
      if (tx.soldAsset) {
        const assetType = tx.soldAsset.assetName?.includes('별장') ? '별장' :
                         tx.soldAsset.assetName?.includes('호텔') ? '호텔' :
                         tx.soldAsset.assetName?.includes('빌딩') ? '빌딩' : '토지';
        return `${tx.soldAsset.assetName} (${assetType}) - 원가: ${formatManwon(tx.soldAsset.originalValue)}`;
      }
      // description이 영문 타입인 경우 표시하지 않음
      if (tx.description && !isTransactionTypeString(tx.description)) {
        return tx.description;
      }
      return null;
    case 'BANK_RECEIVE':
      if (tx.reason) {
        const reasonLabels: Record<string, string> = {
          LOTTERY: '복권 당첨',
          PRIZE: '우승 상금',
          BONUS: '보너스',
          OTHER: tx.description && !isTransactionTypeString(tx.description) ? tx.description : '기타',
        };
        return reasonLabels[tx.reason] || tx.reason;
      }
      // description이 영문 타입인 경우 표시하지 않음
      if (tx.description && !isTransactionTypeString(tx.description)) {
        return tx.description;
      }
      return null;
    case 'SALARY':
      // 월급은 출발지 통과로 발생하므로 별도 상세 정보 불필요
      return null;
    case 'PAY_COST':
      // description이 영문 타입이 아닌 경우에만 표시
      if (tx.description && !isTransactionTypeString(tx.description)) {
        return tx.description;
      }
      return null;
    case 'DONATE':
      // description이 영문 타입이 아닌 경우에만 표시
      if (tx.description && !isTransactionTypeString(tx.description)) {
        return tx.description;
      }
      return null;
    case 'WELFARE_RECEIVE':
      // description이 영문 타입이 아닌 경우에만 표시
      if (tx.description && !isTransactionTypeString(tx.description)) {
        return tx.description;
      }
      return null;
    default:
      // description이 영문 타입이 아닌 경우에만 표시
      if (tx.description && !isTransactionTypeString(tx.description)) {
        return tx.description;
      }
      return null;
  }
};

// 영문 거래 타입 문자열인지 확인하는 헬퍼 함수
const TRANSACTION_TYPE_STRINGS = [
  'TRANSFER', 'BUY_ASSET', 'PAY_COST', 'DONATE', 
  'SALARY', 'WELFARE_RECEIVE', 'BANK_RECEIVE', 'SELL_ASSET'
];

const isTransactionTypeString = (str: string): boolean => {
  return TRANSACTION_TYPE_STRINGS.includes(str.toUpperCase());
};

export const TransactionHistory: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  currentUserId,
  players,
  onRequestCancel,
  welfareFund = 0
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

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {transactions.length === 0 ? (
            // T027: 빈 거래 내역 시 안내 메시지
            <div className="text-center text-slate-500 py-8">
              <div className="text-4xl mb-2">📭</div>
              <p>거래 내역이 없습니다.</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const received = isReceived(tx);
              const detail = getTransactionDetail(tx, getPlayerName);
              const isCancelled = tx.status === 'CANCELLED';

              // 취소 가능 조건: 내가 보낸 거래, 아직 취소 안됨, 취소 가능한 거래 유형만
              // 취소 가능: TRANSFER, DONATE, PAY_COST
              // 취소 불가: BUY_ASSET, SELL_ASSET, SALARY, WELFARE_RECEIVE, BANK_RECEIVE
              const cancellableTypes: TransactionType[] = ['TRANSFER', 'DONATE', 'PAY_COST'];
              const canCancel = !received
                && !isCancelled
                && tx.fromId === currentUserId
                && onRequestCancel
                && cancellableTypes.includes(tx.type);

              // 잔액 확인: 플레이어/복지기금 모두 체크
              const targetPlayer = players.find(p => p.id === tx.toId);
              let targetHasEnoughBalance = true;
              let insufficientReason = '';

              if (tx.toId === 'FUND') {
                // 복지기금 잔액 확인
                targetHasEnoughBalance = welfareFund >= tx.amount;
                if (!targetHasEnoughBalance) {
                  insufficientReason = '복지기금 잔액 부족';
                }
              } else if (tx.toId === 'BANK') {
                // 은행은 무한 자원
                targetHasEnoughBalance = true;
              } else {
                // 플레이어 잔액 확인
                targetHasEnoughBalance = (targetPlayer?.cash ?? 0) >= tx.amount;
                if (!targetHasEnoughBalance) {
                  insufficientReason = '상대방 잔액 부족';
                }
              }

              return (
                <div
                  key={tx.id}
                  className={`p-3 rounded-xl border ${
                    isCancelled
                      ? 'bg-slate-800/30 border-slate-700/50 opacity-60'
                      : received
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          {getTransactionTypeLabel(tx.type)}
                          {isCancelled && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">취소됨</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {received ? (
                            <span>보낸 사람: {getPlayerName(tx.fromId)}</span>
                          ) : (
                            <span>받는 사람: {getPlayerName(tx.toId)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${isCancelled ? 'text-slate-500 line-through' : received ? 'text-green-400' : 'text-red-400'}`}>
                        {received ? '+' : '-'}<MoneyDisplay amount={tx.amount} />
                      </div>
                      <div className="text-xs text-slate-600">
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  {detail && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                      {detail}
                    </div>
                  )}
                  {/* 취소 버튼 */}
                  {canCancel && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <button
                        onClick={() => onRequestCancel(tx.id)}
                        disabled={!targetHasEnoughBalance}
                        className={`w-full text-xs py-2 rounded-lg font-medium transition-colors ${
                          targetHasEnoughBalance
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30'
                            : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-600/30'
                        }`}
                        title={!targetHasEnoughBalance ? insufficientReason : ''}
                      >
                        {targetHasEnoughBalance ? '거래 취소 요청' : `취소 불가 (${insufficientReason})`}
                      </button>
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
