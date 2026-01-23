import React, { useState, useEffect } from 'react';
import type { Player, TransactionType } from '@blue-banker/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: TransactionType, amount: number, toId?: string) => void;
  players: Player[];
  initialType: TransactionType;
  currentUserId?: string;
}

export const TransactionModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  players, 
  initialType,
  currentUserId 
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [toId, setToId] = useState('');

  useEffect(() => {
    if (isOpen) {
        setType(initialType);
        setAmount('');
        setToId('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove non-digit chars
    const cleanAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    
    if (!cleanAmount || cleanAmount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }

    if (type === 'TRANSFER' && !toId) {
        alert('받을 사람을 선택해주세요.');
        return;
    }

    onSubmit(type, cleanAmount, toId);
  };

  const formatInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (!num) return '';
    return parseInt(num, 10).toLocaleString('ko-KR');
  };

  const renderTitle = () => {
    switch(type) {
        case 'TRANSFER': return '송금하기';
        case 'BUY_ASSET': return '자산/비용';
        case 'PAY_COST': return '자산/비용';
        case 'DONATE': return '복지기금 기부';
        default: return '거래';
    }
  };

  const otherPlayers = players.filter(p => p.id !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
           <h3 className="font-bold text-lg text-white">{renderTitle()}</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
           {/* Type Selector for Asset/Cost */}
           {(type === 'BUY_ASSET' || type === 'PAY_COST') && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-lg">
                 <button
                   type="button"
                   onClick={() => setType('BUY_ASSET')}
                   className={`py-2 text-sm font-semibold rounded-md transition-all ${
                     type === 'BUY_ASSET' 
                     ? 'bg-emerald-600 text-white shadow-lg' 
                     : 'text-slate-400 hover:text-white'
                   }`}
                 >
                   자산 매입
                 </button>
                 <button
                   type="button"
                   onClick={() => setType('PAY_COST')}
                   className={`py-2 text-sm font-semibold rounded-md transition-all ${
                     type === 'PAY_COST' 
                     ? 'bg-red-600 text-white shadow-lg' 
                     : 'text-slate-400 hover:text-white'
                   }`}
                 >
                   비용 지불
                 </button>
              </div>
           )}

           {/* Recipient for Transfer */}
           {type === 'TRANSFER' && (
             <div className="space-y-2">
               <label className="text-sm text-slate-400 font-medium">받는 사람</label>
               <div className="grid grid-cols-2 gap-2">
                 {otherPlayers.map(p => (
                   <button
                     key={p.id}
                     type="button"
                     onClick={() => setToId(p.id)}
                     className={`p-3 rounded-xl border text-left transition-all ${
                       toId === p.id
                       ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                       : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                     }`}
                   >
                     <div className="font-semibold">{p.nickname}</div>
                   </button>
                 ))}
                 {otherPlayers.length === 0 && (
                    <div className="col-span-2 text-slate-500 text-sm text-center py-2">
                        보낼 수 있는 다른 플레이어가 없습니다.
                    </div>
                 )}
               </div>
             </div>
           )}

           <div className="space-y-2">
             <label className="text-sm text-slate-400 font-medium">금액 입력</label>
             <div className="relative">
                <input
                   type="text"
                   inputMode="numeric"
                   value={amount}
                   onChange={(e) => setAmount(formatInput(e.target.value))}
                   placeholder="0"
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-2xl font-mono text-white focus:outline-none focus:border-blue-500 placeholder-slate-700 text-right"
                   autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">원</span>
             </div>
             
             {/* Quick Amounts */}
             <div className="flex gap-2 justify-end">
                {[10000, 50000, 100000].map(val => (
                   <button
                     key={val}
                     type="button"
                     onClick={() => {
                        const current = parseInt(amount.replace(/[^0-9]/g, '') || '0', 10);
                        setAmount((current + val).toLocaleString('ko-KR'));
                     }}
                     className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-xs text-slate-300 transition-colors"
                   >
                     +{val/10000}만
                   </button>
                ))}
             </div>
           </div>

           <button
             type="submit"
             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={!amount || (type === 'TRANSFER' && !toId)}
           >
             확인
           </button>
        </form>
      </div>
    </div>
  );
};
