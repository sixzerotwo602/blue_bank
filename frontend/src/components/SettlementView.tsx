import React from 'react';
import type { Ranking } from '@blue-banker/shared';
import { MoneyDisplay } from './MoneyDisplay';

interface Props {
  rankings: Ranking[] | null;
  onGoHome: () => void;
}

export const SettlementView: React.FC<Props> = ({ rankings, onGoHome }) => {
  if (!rankings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-8">
         <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 animate-pulse pb-2">
             게임 종료
         </h1>
         <p className="text-slate-400">최종 정산 결과</p>
      </div>

      <div className="w-full max-w-lg space-y-4 mb-10 overflow-y-auto max-h-[60vh] pr-2">
         {rankings.map((p, index) => {
             const isWinner = index === 0;
             return (
                 <div 
                   key={p.id} 
                   className={`
                      relative p-4 rounded-xl border flex items-center gap-4 transition-all
                      ${isWinner 
                          ? 'bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                          : 'bg-slate-900 border-slate-800'
                      }
                   `}
                 >
                     <div className={`
                         w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg
                         ${isWinner ? 'bg-yellow-500 text-yellow-950' : 'bg-slate-800 text-slate-400'}
                     `}>
                         {p.rank}
                     </div>

                     <div className="flex-1">
                         <div className="font-bold text-white text-lg flex items-center gap-2">
                             {p.nickname}
                             {isWinner && <span className="text-xl">👑</span>}
                         </div>
                         <div className="flex gap-3 text-xs text-slate-400 mt-1">
                             <span>현금: <MoneyDisplay amount={p.cash} showCurrency={false} /></span>
                             <span className="w-px h-3 bg-slate-700"></span>
                             <span>자산: <MoneyDisplay amount={p.assetValue} showCurrency={false} /></span>
                         </div>
                     </div>

                     <div className="text-right">
                         <div className="text-xs text-slate-500 mb-1">총 자산 <span className="text-slate-600">(클릭: 단위 변경)</span></div>
                         <div className={`font-mono font-bold text-xl ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                             <MoneyDisplay amount={p.totalAssets} clickable />
                         </div>
                     </div>
                 </div>
             );
         })}
      </div>

      <button
        onClick={onGoHome}
        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-all active:scale-95 flex items-center gap-2 border border-slate-700"
      >
        <span>🏠</span>
        홈으로 돌아가기
      </button>
    </div>
  );
};
