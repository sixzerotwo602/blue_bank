import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import { MoneyDisplay } from '../components/MoneyDisplay';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionHistory } from '../components/TransactionHistory';
import { BankReceiveModal } from '../components/BankReceiveModal';
import { SellAssetModal } from '../components/SellAssetModal';
import { GameEndVotePopup } from '../components/GameEndVotePopup';
import { BankReceiveVotePopup } from '../components/BankReceiveVotePopup';
import { CancelRequestPopup } from '../components/CancelRequestPopup';
import { WelfareFundVotePopup } from '../components/WelfareFundVotePopup';
import { RankingList } from '../components/RankingList';
import { ConfirmModal } from '../components/ConfirmModal';
// ConnectionStatus and KickPlayerButton are now used in RankingList
import type { TransactionType, Transaction } from '@blue-banker/shared';

import { SettlementView } from '../components/SettlementView';

export const Dashboard: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, requestTransaction, activeVote, castVote, requestFund, rankings, kickPlayer, getTransactionHistory, requestBankReceive, sellAsset, gameEndVote, requestGameEnd, castGameEndVote, cancelGameEndVote, bankReceiveVote, cancelRequest, respondCancelTransaction, requestCancelTransaction, renameAsset, setTransactionUpdateCallback } = useGame(roomId);
  const { socket } = useSocket();
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('TRANSFER');
  
  // T026: 거래 내역 모달 상태
  const [historyOpen, setHistoryOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // T043: 은행 수령 모달 상태
  const [bankReceiveOpen, setBankReceiveOpen] = useState(false);
  
  // T052: 자산 매각 모달 상태
  const [sellAssetOpen, setSellAssetOpen] = useState(false);

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

  // 거래 내역 갱신 함수 (훅은 조건부 반환 전에 호출되어야 함)
  const refreshTransactions = useCallback(async () => {
      if (historyOpen) {
          const history = await getTransactionHistory();
          setTransactions(history);
      }
  }, [historyOpen, getTransactionHistory]);

  // 거래 취소 시 실시간 갱신을 위한 콜백 등록
  useEffect(() => {
      if (historyOpen) {
          setTransactionUpdateCallback(refreshTransactions);
      } else {
          setTransactionUpdateCallback(null);
      }
      return () => setTransactionUpdateCallback(null);
  }, [historyOpen, refreshTransactions, setTransactionUpdateCallback]);

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

  // T063: 게임 종료 - 투표 요청 방식으로 변경
  const handleGameEnd = () => {
      setConfirmState({
          isOpen: true,
          title: '게임 종료 투표',
          message: '게임 종료 투표를 시작하시겠습니까?\n모든 플레이어가 동의해야 게임이 종료됩니다.',
          onConfirm: async () => {
              closeConfirm();
              await requestGameEnd();
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
  
  // T026: 거래 내역 조회 핸들러
  const handleOpenHistory = async () => {
      const history = await getTransactionHistory();
      setTransactions(history);
      setHistoryOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
       <nav className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-[1000]">
          <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Blue Bank</div>
          <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400">#{roomId}</div>
       </nav>

       <main className="p-4 space-y-5">
          {/* Status Card - T040: clickable prop 추가 */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
             <div className="relative z-10">
                <div className="text-slate-400 text-sm mb-1 font-medium">내 현금 자산 <span className="text-xs text-slate-500">(탭하여 형식 변경)</span></div>
                <div className="text-4xl font-bold text-green-400 mb-4 tracking-tight">
                   <MoneyDisplay amount={me?.cash || 0} clickable />
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-950/30 p-3 rounded-lg w-fit border border-white/5">
                   <span className="text-slate-400">총 부동산 가치:</span>
                   <span className="text-blue-300 font-mono"><MoneyDisplay amount={me?.assetValue || 0} showCurrency={false} clickable /></span>
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
                <div className="text-emerald-100">토지/건물 매입</div>
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
          
          {/* T026: 거래 내역 버튼 */}
          <button
             onClick={handleOpenHistory}
             className="w-full bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
             <span>📋</span>
             <span>거래 내역 보기</span>
          </button>
          
          {/* T012: 은행 수령(모든 플레이어) 및 자산 매각 버튼 */}
          <div className="grid grid-cols-2 gap-2">
             <button
                onClick={() => setBankReceiveOpen(true)}
                className="bg-amber-900/30 hover:bg-amber-900/50 p-3 rounded-xl border border-amber-500/30 text-amber-300 flex items-center justify-center gap-2 transition-colors"
             >
                <span>🏦</span>
                <span className="text-sm">은행 수령</span>
             </button>
             <button
                onClick={() => setSellAssetOpen(true)}
                className="bg-red-900/20 hover:bg-red-900/30 p-3 rounded-xl border border-red-500/20 text-red-400 flex items-center justify-center gap-2 transition-colors"
             >
                <span>📤</span>
                <span className="text-sm">자산 매각</span>
             </button>
          </div>

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
            onRenameAsset={renameAsset}
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
         onSubmit={async (type, amount, toId, assetType, buildingType, landName, selectedLandId, villaCount) => {
             // T028: 토지/건물 매입 시 추가 정보 전달
             const success = await requestTransaction(type, amount, toId, assetType, buildingType, landName, selectedLandId, villaCount);
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
         <WelfareFundVotePopup
           vote={activeVote}
           players={room.players}
           currentUserId={socket?.id}
           onCastVote={castVote}
         />
       )}

        {/* T026: 거래 내역 모달 */}
        <TransactionHistory
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          transactions={transactions}
          currentUserId={socket?.id}
          players={room.players}
          onRequestCancel={requestCancelTransaction}
        />
        
        {/* Task 5.3: 은행 수령 모달 - 투표 시스템으로 전환 */}
        <BankReceiveModal
          isOpen={bankReceiveOpen}
          onClose={() => setBankReceiveOpen(false)}
          onSubmit={(amount, reason) => requestBankReceive(amount, reason)}
          currentUserId={socket?.id}
          currentUserNickname={me?.nickname}
        />
        
        {/* T052: 자산 매각 모달 */}
        <SellAssetModal
          isOpen={sellAssetOpen}
          onClose={() => setSellAssetOpen(false)}
          onSubmit={sellAsset}
          assets={me?.assets || []}
        />
        
        {/* T063: 게임 종료 투표 팝업 - T049: 취소 버튼 추가 */}
        {gameEndVote && room && (
          <GameEndVotePopup
            vote={gameEndVote}
            players={room.players}
            currentUserId={socket?.id}
            onCastVote={castGameEndVote}
            onCancelVote={cancelGameEndVote}
          />
        )}

        {/* Task 5.4: 은행 수령 투표 팝업 */}
        {bankReceiveVote && room && (
          <BankReceiveVotePopup
            vote={bankReceiveVote}
            players={room.players}
            currentUserId={socket?.id}
            onCastVote={castVote}
          />
        )}

        {/* Task 6.4: 거래 취소 요청 팝업 */}
        {cancelRequest && room && (
          <CancelRequestPopup
            request={cancelRequest}
            players={room.players}
            transactions={transactions}
            onRespond={respondCancelTransaction}
          />
        )}

       {/* Settlement Overlay */}
       <SettlementView rankings={rankings} onGoHome={handleGoHome} />
    </div>
  );
};
