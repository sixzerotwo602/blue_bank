import React, { useState, useEffect } from 'react';
import type { Player, TransactionType } from '@blue-banker/shared';

type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: TransactionType, amount: number, toId?: string, assetType?: 'LAND' | 'BUILDING', buildingType?: BuildingType) => void;
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
  const [assetType, setAssetType] = useState<'LAND' | 'BUILDING'>('LAND');
  const [buildingType, setBuildingType] = useState<BuildingType | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
        setType(initialType);
        setAmount('');
        setToId('');
        setAssetType('LAND');
        setBuildingType(undefined);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    
    if (!cleanAmount || cleanAmount <= 0) {
        alert('올바른 금액을 입력해주세요.');
        return;
    }

    if (type === 'TRANSFER' && !toId) {
        alert('받을 사람을 선택해주세요.');
        return;
    }

    onSubmit(type, cleanAmount, toId, type === 'BUY_ASSET' ? assetType : undefined, type === 'BUY_ASSET' && assetType === 'BUILDING' ? buildingType : undefined);
  };

  const formatInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (!num) return '';
    // 최대 10자리 제한 (약 100억 원)
    const limited = num.slice(0, 10);
    return parseInt(limited, 10).toLocaleString('ko-KR');
  };

  const adjustAmount = (diff: number) => {
      const current = parseInt(amount.replace(/[^0-9]/g, '') || '0', 10);
      const next = current + diff;
      if (next < 0) {
          setAmount('0');
      } else {
          setAmount(next.toLocaleString('ko-KR'));
      }
  };


  const renderTitle = () => {
    switch(type) {
        case 'TRANSFER': return '송금하기';
        case 'BUY_ASSET': return '토지/건물 매입';
        case 'PAY_COST': return '은행에 납부';
        case 'DONATE': return '복지기금 기부';
        default: return '거래';
    }
  };

  const otherPlayers = players.filter(p => p.id !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 pt-8 sm:pt-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in my-auto">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
           <h3 className="font-bold text-lg text-white">{renderTitle()}</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
           {/* Asset Sub-selector for BUY_ASSET - 4-button grid */}
           {type === 'BUY_ASSET' && (
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => { setAssetType('LAND'); setBuildingType(undefined); }}
                        className={`py-3 text-sm font-semibold rounded-lg border transition-all ${
                            assetType === 'LAND'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        🏞️ 토지
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAssetType('BUILDING'); setBuildingType('HOTEL'); }}
                        className={`py-3 text-sm font-semibold rounded-lg border transition-all ${
                            assetType === 'BUILDING' && buildingType === 'HOTEL'
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        🏨 호텔
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAssetType('BUILDING'); setBuildingType('BUILDING'); }}
                        className={`py-3 text-sm font-semibold rounded-lg border transition-all ${
                            assetType === 'BUILDING' && buildingType === 'BUILDING'
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        🏢 빌딩
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAssetType('BUILDING'); setBuildingType('VILLA'); }}
                        className={`py-3 text-sm font-semibold rounded-lg border transition-all ${
                            assetType === 'BUILDING' && buildingType === 'VILLA'
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        🏡 별장
                    </button>
                  </div>
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
             <div className="relative min-h-[60px]">
                <input
                   type="text"
                   inputMode="numeric"
                   value={amount}
                   onChange={(e) => setAmount(formatInput(e.target.value))}
                   placeholder="0"
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 pr-12 text-2xl font-mono text-white focus:outline-none focus:border-blue-500 placeholder-slate-700 text-right"
                   autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">원</span>
             </div>
             
              {/* Quick Amounts - Grid Layout */}
              {type === 'DONATE' ? (
                /* DONATE: 3-row grid with +15만원 full width first */
                <div className="grid grid-cols-3 gap-1.5">
                   <button
                       type="button"
                       onClick={() => adjustAmount(150000)}
                       className="col-span-3 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white transition-colors whitespace-nowrap font-semibold"
                   >
                       +15만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(100000)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +10만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(50000)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(10000)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +1만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-100000)}
                       className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -10만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-50000)}
                       className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-10000)}
                       className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -1만
                   </button>
                </div>
              ) : (
                /* Default: 2-row 3x2 grid */
                <div className="grid grid-cols-3 gap-1.5">
                   <button
                       type="button"
                       onClick={() => adjustAmount(100000)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +10만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(50000)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(10000)}
                       className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +1만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-100000)}
                       className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -10만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-50000)}
                       className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-10000)}
                       className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -1만
                   </button>
                </div>
              )}
           </div>

           {/* Dual buttons for TRANSFER type */}
           {type === 'TRANSFER' ? (
             <div className="grid grid-cols-2 gap-3">
               <button
                 type="submit"
                 className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                 disabled={!amount || !toId}
               >
                 플레이어에게 송금
               </button>
               <button
                 type="button"
                 onClick={() => {
                   const cleanAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
                   if (!cleanAmount || cleanAmount <= 0) {
                     alert('올바른 금액을 입력해주세요.');
                     return;
                   }
                   onSubmit('PAY_COST', cleanAmount);
                 }}
                 className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                 disabled={!amount}
               >
                 은행으로 송금
               </button>
             </div>
           ) : (
             <button
               type="submit"
               className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={!amount}
             >
               확인
             </button>
           )}
        </form>
      </div>
    </div>
  );
};
