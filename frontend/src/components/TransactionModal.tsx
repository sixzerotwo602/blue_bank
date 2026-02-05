import React, { useState, useEffect } from 'react';
import type { Player, TransactionType, Asset } from '@blue-banker/shared';
import toast from 'react-hot-toast';
import { MAX_AMOUNT } from '../utils/constants';

type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: TransactionType, amount: number, toId?: string, assetType?: 'LAND' | 'BUILDING', buildingType?: BuildingType, landName?: string, selectedLandId?: string, villaCount?: number) => void;
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
  // T021-T023: 토지/건물 매입 개선을 위한 상태
  const [landName, setLandName] = useState('');
  const [selectedLandId, setSelectedLandId] = useState('');
  const [villaCount, setVillaCount] = useState<1 | 2>(1);

  // 현재 플레이어의 보유 토지 목록 조회
  const currentPlayer = players.find(p => p.id === currentUserId);
  const ownedLands = currentPlayer?.assets?.filter((a: Asset) => a.type === 'LAND') || [];

  useEffect(() => {
    if (isOpen) {
        setType(initialType);
        setAmount('');
        setToId('');
        setAssetType('LAND');
        setBuildingType(undefined);
        setLandName('');
        setSelectedLandId('');
        setVillaCount(1);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);

    if (!cleanAmount || cleanAmount <= 0) {
        toast.error('올바른 금액을 입력해주세요.');
        return;
    }

    // T027: 100조 제한 검증
    if (cleanAmount > MAX_AMOUNT) {
        toast.error('금액은 100조 원을 초과할 수 없습니다.');
        return;
    }

    if (type === 'TRANSFER' && !toId) {
        toast.error('받을 사람을 선택해주세요.');
        return;
    }

    // T021-T027: 토지/건물 매입 검증
    if (type === 'BUY_ASSET') {
        if (assetType === 'LAND') {
            // 토지 매입 시 토지명 필수
            if (!landName.trim()) {
                toast.error('토지명을 입력해주세요.');
                return;
            }
            // T027: 토지명 중복 검증 (같은 플레이어 내)
            const isDuplicate = ownedLands.some((land: Asset) =>
                land.name?.toLowerCase() === landName.trim().toLowerCase()
            );
            if (isDuplicate) {
                toast.error('이미 동일한 이름의 토지를 보유하고 있습니다.');
                return;
            }
        } else if (assetType === 'BUILDING') {
            // 건물 매입 시 토지 선택 필수
            if (!selectedLandId) {
                toast.error('건물을 지을 토지를 선택해주세요.');
                return;
            }
        }
    }

    onSubmit(
        type,
        cleanAmount,
        toId,
        type === 'BUY_ASSET' ? assetType : undefined,
        type === 'BUY_ASSET' && assetType === 'BUILDING' ? buildingType : undefined,
        type === 'BUY_ASSET' && assetType === 'LAND' ? landName.trim() : undefined,
        type === 'BUY_ASSET' && assetType === 'BUILDING' ? selectedLandId : undefined,
        type === 'BUY_ASSET' && assetType === 'BUILDING' && buildingType === 'VILLA' ? villaCount : undefined
    );
  };

  // T041: 100조 제한 적용
  const formatInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (!num) return '';
    const parsed = parseInt(num, 10);
    // MAX_AMOUNT (100조)를 초과하지 않도록 제한
    const limited = Math.min(parsed, MAX_AMOUNT);
    return limited.toLocaleString('ko-KR');
  };

  const adjustAmount = (diff: number) => {
      const current = parseInt(amount.replace(/[^0-9]/g, '') || '0', 10);
      const next = Math.min(Math.max(0, current + diff), MAX_AMOUNT);
      setAmount(next.toLocaleString('ko-KR'));
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

                  {/* T024: 토지 선택 시 토지명 입력 필드 */}
                  {assetType === 'LAND' && (
                      <div className="mt-3">
                          <label className="text-sm text-slate-400 font-medium block mb-2">토지명</label>
                          <input
                              type="text"
                              value={landName}
                              onChange={(e) => setLandName(e.target.value)}
                              placeholder="예: 서울, 부산, 제주..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                              maxLength={20}
                          />
                      </div>
                  )}

                  {/* T025: 호텔/빌딩/별장 선택 시 보유 토지 드롭다운 */}
                  {assetType === 'BUILDING' && (
                      <div className="mt-3">
                          <label className="text-sm text-slate-400 font-medium block mb-2">건물을 지을 토지</label>
                          {ownedLands.length === 0 ? (
                              <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                                  ⚠️ 보유한 토지가 없습니다. 먼저 토지를 매입하세요.
                              </div>
                          ) : (
                              <select
                                  value={selectedLandId}
                                  onChange={(e) => setSelectedLandId(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                              >
                                  <option value="">-- 토지 선택 --</option>
                                  {ownedLands.map((land: Asset) => (
                                      <option key={land.id} value={land.id}>
                                          {land.name || '토지'}
                                      </option>
                                  ))}
                              </select>
                          )}
                      </div>
                  )}

                  {/* T026: 별장 갯수 선택 버튼 */}
                  {assetType === 'BUILDING' && buildingType === 'VILLA' && (
                      <div className="mt-3">
                          <label className="text-sm text-slate-400 font-medium block mb-2">별장 개수</label>
                          <div className="grid grid-cols-2 gap-2">
                              <button
                                  type="button"
                                  onClick={() => setVillaCount(1)}
                                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                                      villaCount === 1
                                      ? 'border-green-500 bg-green-500/20 text-green-300'
                                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                                  }`}
                              >
                                  1개
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setVillaCount(2)}
                                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                                      villaCount === 2
                                      ? 'border-green-500 bg-green-500/20 text-green-300'
                                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                                  }`}
                              >
                                  2개 (최대)
                              </button>
                          </div>
                      </div>
                  )}
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
                     onClick={() => setToId(toId === p.id ? '' : p.id)}
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
             {/* T019-T020: autoFocus 제거 */}
             <div className="relative min-h-[60px]">
                <input
                   type="text"
                   inputMode="numeric"
                   value={amount}
                   onChange={(e) => setAmount(formatInput(e.target.value))}
                   placeholder="0"
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 pr-12 text-2xl font-mono text-white focus:outline-none focus:border-blue-500 placeholder-slate-700 text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">원</span>
             </div>
             
              {/* Quick Amounts - Grid Layout */}
              {type === 'DONATE' ? (
                /* DONATE: 15만원 버튼 추가 포함 */
                <div className="grid grid-cols-4 gap-1.5">
                   <button
                       type="button"
                       onClick={() => adjustAmount(150000)}
                       className="col-span-4 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white transition-colors whitespace-nowrap font-semibold"
                   >
                       +15만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(50000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(10000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +1만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(5000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +5천
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(1000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +1천
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-50000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-10000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -1만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-5000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -5천
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-1000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -1천
                   </button>
                </div>
              ) : (
                /* Default: 4x2 grid with 5만/1만/5천/1천원 단위 */
                <div className="grid grid-cols-4 gap-1.5">
                   <button
                       type="button"
                       onClick={() => adjustAmount(50000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(10000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +1만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(5000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +5천
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(1000)}
                       className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
                   >
                       +1천
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-50000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -5만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-10000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -1만
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-5000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -5천
                   </button>
                   <button
                       type="button"
                       onClick={() => adjustAmount(-1000)}
                       className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors whitespace-nowrap"
                   >
                       -1천
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
                 disabled={!amount || !!toId}
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
