import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import { MoneyDisplay } from '../components/MoneyDisplay';
import { TransactionModal } from '../components/TransactionModal';
import { VotePopup } from '../components/VotePopup';
import { RankingList } from '../components/RankingList';
import { ConfirmModal } from '../components/ConfirmModal';
// ConnectionStatus and KickPlayerButton are now used in RankingList
import type { TransactionType } from '@blue-banker/shared';

import { SettlementView } from '../components/SettlementView';

export const Dashboard: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, requestTransaction, activeVote, castVote, requestFund, rankings, endGame, kickPlayer } = useGame(roomId);
  const { socket } = useSocket();
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('TRANSFER');

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
  });

  const closeConfirm = () => {
      setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  if (!room) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
       <div className="animate-pulse">Loading Room...</div>
    </div>
  );

  const me = room.players.find(p => p.id === socket?.id);
  const isHost = me?.isHost;
  
  const openModal = (type: TransactionType) => {
      setTxType(type);
      setModalOpen(true);
  };

  const handleSalary = () => {
      setConfirmState({
          isOpen: true,
          title: '월급 받기',
          message: '월급을 받으시겠습니까? (20만원)',
          onConfirm: () => {
              requestTransaction('SALARY', 200000);
              closeConfirm();
          }
      });
  };

  const handleRequestFund = () => {
      setConfirmState({
          isOpen: true,
          title: '복지기금 수령',
          message: '복지기금 전액을 수령하시겠습니까?\n(투표 필요)',
          onConfirm: () => {
              requestFund(0);
              closeConfirm();
          }
      });
  };

  const handleGameEnd = () => {
      setConfirmState({
          isOpen: true,
          title: '게임 종료',
          message: '정말 게임을 종료하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
          onConfirm: () => {
              endGame();
              closeConfirm();
          }
      });
  };

  // Kick player handler with confirmation (T052)
  const handleKickPlayer = (playerId: string) => {
      const player = room.players.find(p => p.id === playerId);
      if (!player) return;
      
      setConfirmState({
          isOpen: true,
          title: '플레이어 강제 퇴장',
          message: `${player.nickname}님을 강제 퇴장시키겠습니까?\n해당 플레이어의 모든 자산이 삭제됩니다.`,
          onConfirm: () => {
              kickPlayer(playerId);
              closeConfirm();
          }
      });
  };

  const handleGoHome = () => {
      // Disconnect socket logic handled inside useSocket or manual simple redirect
      window.location.href = '/'; 
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
       <nav className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-[1000]">
          <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Blue Banker</div>
          <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400">#{roomId}</div>
       </nav>

       <main className="p-4 space-y-5">
          {/* Status Card */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
             <div className="relative z-10">
                <div className="text-slate-400 text-sm mb-1 font-medium">내 현금 자산</div>
                <div className="text-4xl font-bold text-green-400 mb-4 tracking-tight">
                   <MoneyDisplay amount={me?.cash || 0} />
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-950/30 p-3 rounded-lg w-fit border border-white/5">
                   <span className="text-slate-400">총 부동산 가치:</span>
                   <span className="text-blue-300 font-mono"><MoneyDisplay amount={me?.assetValue || 0} showCurrency={false} /></span>
                </div>
             </div>
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => openModal('TRANSFER')}
                className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:bg-blue-700 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 h-32"
             >
                <div className="text-2xl">💸</div>
                <div className="text-blue-100">송금하기</div>
             </button>
             <button 
                onClick={() => openModal('BUY_ASSET')}
                className="bg-emerald-600 hover:bg-emerald-500 p-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:bg-emerald-700 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 h-32"
             >
                <div className="text-2xl">🏠</div>
                <div className="text-emerald-100">토지/건물/비용지불</div>
             </button>
             <button 
                onClick={() => openModal('DONATE')}
                className="bg-purple-600 hover:bg-purple-500 p-4 rounded-2xl font-bold shadow-lg shadow-purple-900/20 active:bg-purple-700 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 h-24"
             >
                <div className="text-lg">🤝</div>
                <div className="text-sm text-purple-100">복지기금 기부</div>
             </button>
             <button 
                onClick={handleSalary}
                className="bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl font-bold shadow-lg active:bg-slate-800 transition-all active:scale-95 border border-slate-600 flex flex-col items-center justify-center gap-1 h-24"
             >
                <div className="text-lg">💵</div>
                <div className="text-sm text-slate-200">월급 받기</div>
             </button>
          </section>

          {/* Welfare Fund Status */}
          <section className="bg-slate-900/50 rounded-xl p-4 border border-purple-500/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 text-xl">🏦</div>
                  <div>
                      <h3 className="text-xs text-purple-300 font-bold uppercase tracking-wider">사회복지기금</h3>
                      <div className="text-xl font-bold text-white">
                         <MoneyDisplay amount={room.welfareFund} />
                      </div>
                  </div>
              </div>
              <button 
                className="text-xs bg-purple-500/10 text-purple-300 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                onClick={handleRequestFund} 
              >
                  수령 요청
              </button>
          </section>

          {/* Ranking List */}
          <RankingList 
            players={room.players} 
            currentUserId={socket?.id} 
            isHost={isHost}
            onKick={handleKickPlayer}
          />

          {/* Host Actions: Game End */}
          {isHost && (
              <div className="pt-8 pb-4">
                  <button
                    onClick={handleGameEnd}
                    className="w-full bg-red-950/30 text-red-500 border border-red-900/50 p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                  >
                      <span>🚫</span>
                      게임 종료 / 최종 정산
                  </button>
              </div>
          )}
       </main>

       {/* Footer / Coming Soon */}
       <div className="px-4 text-center text-slate-700 text-xs pb-6">
          Blue Marble Bank v0.1.0 • Connected
       </div>

       <TransactionModal 
         isOpen={modalOpen}
         onClose={() => setModalOpen(false)}
         onSubmit={async (type, amount, toId, assetType) => {
             const success = await requestTransaction(type, amount, toId, assetType);
             if (success) {
                 setModalOpen(false);
             }
         }}
         players={room.players}
         initialType={txType}
         currentUserId={socket?.id}
       />
       
       <ConfirmModal 
         isOpen={confirmState.isOpen}
         title={confirmState.title}
         message={confirmState.message}
         onConfirm={confirmState.onConfirm}
         onCancel={closeConfirm}
       />

       {activeVote && (
         <VotePopup 
           vote={activeVote}
           players={room.players}
           currentUserId={socket?.id}
           onCastVote={castVote}
         />
       )}

       {/* Settlement Overlay */}
       <SettlementView rankings={rankings} onGoHome={handleGoHome} />
    </div>
  );
};
