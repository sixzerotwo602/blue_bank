import React, { useState } from 'react';
import type { Player, Asset } from '@blue-banker/shared';
import { MoneyDisplay } from './MoneyDisplay';
import { ConnectionStatus } from './ConnectionStatus';
import { KickPlayerButton } from './KickPlayerButton';
import { PlayerAssetModal } from './PlayerAssetModal';

type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';

interface Props {
  players: Player[];
  currentUserId?: string;
  className?: string;
  isHost?: boolean;
  onKick?: (playerId: string) => void;
}

// T016: Helper function to calculate asset count and value by type
const getAssetStats = (assets: Asset[] | undefined) => {
  if (!assets || assets.length === 0) {
    return {
      land: { count: 0, value: 0 },
      buildings: {
        hotel: { count: 0, value: 0 },
        building: { count: 0, value: 0 },
        villa: { count: 0, value: 0 },
        total: { count: 0, value: 0 }
      }
    };
  }

  const land = assets.filter(a => a.type === 'LAND');
  const buildings = assets.filter(a => a.type === 'BUILDING');

  // Group buildings by buildingType (T019: building type icons)
  // Use type assertion since shared package may not be rebuilt yet
  const hotel = buildings.filter(a => (a as Asset & { buildingType?: BuildingType }).buildingType === 'HOTEL');
  const building = buildings.filter(a => {
    const bt = (a as Asset & { buildingType?: BuildingType }).buildingType;
    return bt === 'BUILDING' || !bt; // T021: legacy fallback
  });
  const villa = buildings.filter(a => (a as Asset & { buildingType?: BuildingType }).buildingType === 'VILLA');

  return {
    land: {
      count: land.length,
      value: land.reduce((sum, a) => sum + a.value, 0)
    },
    buildings: {
      hotel: { count: hotel.length, value: hotel.reduce((sum, a) => sum + a.value, 0) },
      building: { count: building.length, value: building.reduce((sum, a) => sum + a.value, 0) },
      villa: { count: villa.length, value: villa.reduce((sum, a) => sum + a.value, 0) },
      total: { count: buildings.length, value: buildings.reduce((sum, a) => sum + a.value, 0) }
    }
  };
};

// T019: Helper function to get building icon by type
const getBuildingIcon = (type: BuildingType | undefined): string => {
  switch (type) {
    case 'HOTEL': return '🏨';
    case 'VILLA': return '🏡';
    case 'BUILDING':
    default: return '🏢';
  }
};

// Format value in 만원 units
const formatValue = (value: number): string => {
  if (value === 0) return '0';
  const man = Math.floor(value / 10000);
  return `${man.toLocaleString('ko-KR')}만`;
};

export const RankingList: React.FC<Props> = ({
  players,
  currentUserId,
  className = '',
  isHost = false,
  onKick
}) => {
  // T035: 선택된 플레이어 상태
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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
             const stats = getAssetStats(player.assets);
             const hasAssets = stats.land.count > 0 || stats.buildings.total.count > 0;

             let rankColor = 'text-slate-500';
             let rankIcon = null;
             if (index === 0) { rankColor = 'text-yellow-400'; rankIcon = '🥇'; }
             else if (index === 1) { rankColor = 'text-slate-300'; rankIcon = '🥈'; }
             else if (index === 2) { rankColor = 'text-amber-600'; rankIcon = '🥉'; }

             return (
                 <div
                   key={player.id}
                   onClick={() => setSelectedPlayer(player)}
                   className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer hover:bg-slate-700/50 ${
                      isMe ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-slate-800/50 border border-transparent'
                   }`}
                 >
                    <div className="flex items-center gap-3">
                       <div className={`font-bold w-6 text-center ${rankColor} text-lg`}>
                          {rankIcon || index + 1}
                       </div>
                       {/* Connection Status Indicator (T022) */}
                       <ConnectionStatus status={player.connectionStatus || 'ONLINE'} size="sm" />
                       <div>
                          <div className={`font-bold ${isMe ? 'text-blue-300' : 'text-slate-300'}`}>
                             {player.nickname} {isMe && <span className="text-xs font-normal text-blue-400 bg-blue-400/10 px-1 rounded ml-1">나</span>}
                          </div>
                          <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                             <span>현금: <MoneyDisplay amount={player.cash} showCurrency={false} /></span>
                             <span className="text-slate-600">|</span>
                             {/* T017-T018, T020: Asset display with count and value */}
                             {hasAssets ? (
                               <>
                                 {stats.land.count > 0 && (
                                   <span title="토지">🏞️ 토지: {stats.land.count}개 ({formatValue(stats.land.value)})</span>
                                 )}
                                 {stats.buildings.hotel.count > 0 && (
                                   <span title="호텔">{getBuildingIcon('HOTEL')} 호텔: {stats.buildings.hotel.count}개 ({formatValue(stats.buildings.hotel.value)})</span>
                                 )}
                                 {stats.buildings.building.count > 0 && (
                                   <span title="빌딩">{getBuildingIcon('BUILDING')} 빌딩: {stats.buildings.building.count}개 ({formatValue(stats.buildings.building.value)})</span>
                                 )}
                                 {stats.buildings.villa.count > 0 && (
                                   <span title="별장">{getBuildingIcon('VILLA')} 별장: {stats.buildings.villa.count}개 ({formatValue(stats.buildings.villa.value)})</span>
                                 )}
                               </>
                             ) : (
                               <span>🏞️ 0 | 🏢 0</span>
                             )}
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       {/* Kick Button for Host (T051) */}
                       {isHost && onKick && !isMe && (
                         <KickPlayerButton 
                           player={player} 
                           onKick={onKick} 
                           isHost={isHost} 
                         />
                       )}
                       <div className="text-right">
                          <div className="font-bold text-slate-200">
                             <MoneyDisplay amount={totalAsset} />
                          </div>
                          <div className="text-xs text-slate-500">
                             총 자산
                          </div>
                       </div>
                    </div>
                 </div>
             );
          })}
       </div>

       {/* T037: PlayerAssetModal */}
       <PlayerAssetModal
         isOpen={selectedPlayer !== null}
         onClose={() => setSelectedPlayer(null)}
         player={selectedPlayer}
       />
    </div>
  );
};

