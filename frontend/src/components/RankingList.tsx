import React from 'react';
import type { Player } from '@blue-banker/shared';
import { MoneyDisplay } from './MoneyDisplay';

interface Props {
  players: Player[];
  currentUserId?: string;
  className?: string;
}

export const RankingList: React.FC<Props> = ({ players, currentUserId, className = '' }) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const totalA = a.cash + a.assetValue;
    const totalB = b.cash + b.assetValue;
    return totalB - totalA; // Descending
  });

  return (
    <div className={`bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-800 ${className}`}>
       <h3 className="text-slate-400 font-bold mb-3 flex items-center gap-2">
          🏆 실시간 랭킹
       </h3>
       
       <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
             const isMe = player.id === currentUserId;
             const totalAsset = player.cash + player.assetValue;
             
             let rankColor = 'text-slate-500';
             let rankIcon = null;
             if (index === 0) { rankColor = 'text-yellow-400'; rankIcon = '🥇'; }
             else if (index === 1) { rankColor = 'text-slate-300'; rankIcon = '🥈'; }
             else if (index === 2) { rankColor = 'text-amber-600'; rankIcon = '🥉'; }

             return (
                 <div 
                   key={player.id} 
                   className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isMe ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-slate-800/50 border border-transparent'
                   }`}
                 >
                    <div className="flex items-center gap-3">
                       <div className={`font-bold w-6 text-center ${rankColor} text-lg`}>
                          {rankIcon || index + 1}
                       </div>
                       <div>
                          <div className={`font-bold ${isMe ? 'text-blue-300' : 'text-slate-300'}`}>
                             {player.nickname} {isMe && <span className="text-xs font-normal text-blue-400 bg-blue-400/10 px-1 rounded ml-1">나</span>}
                          </div>
                          <div className="text-xs text-slate-500">
                             현금: <MoneyDisplay amount={player.cash} showCurrency={false} />
                          </div>
                       </div>
                    </div>
                    
                    <div className="text-right">
                       <div className="font-bold text-slate-200">
                          <MoneyDisplay amount={totalAsset} />
                       </div>
                       <div className="text-xs text-slate-500">
                          총 자산
                       </div>
                    </div>
                 </div>
             );
          })}
       </div>
    </div>
  );
};
