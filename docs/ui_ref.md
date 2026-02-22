import React, { useState, useEffect } from 'react';
import {
CreditCard, Landmark, Hammer, Coins, HandCoins, ArrowRightLeft,
TrendingUp, Home, Menu, Bell, ChevronRight, Users, QrCode,
Trophy, ThumbsUp, X, Loader2, AlertCircle
} from 'lucide-react';

// --- Shared Components (Toss Style) ---
const Card = ({ children, className = "", onClick }) => (

  <div onClick={onClick} className={`bg-white rounded-[24px] p-6 shadow-sm mb-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = "", onClick, disabled }) => {
const baseStyle = "w-full py-4 rounded-[16px] font-bold text-[17px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const variants = {
primary: "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-200",
secondary: "bg-blue-50 text-blue-600 hover:bg-blue-100",
gray: "bg-gray-100 text-gray-600 hover:bg-gray-200",
danger: "bg-red-50 text-red-500 hover:bg-red-100"
};
return (
<button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
{children}
</button>
);
};

const ActionButton = ({ icon: Icon, title, sub, onClick, colorClass = "bg-gray-100 text-gray-600" }) => (
<button
onClick={onClick}
className="w-full flex items-center justify-between p-4 mb-3 bg-white hover:bg-gray-50 rounded-[20px] transition-colors active:scale-[0.98] duration-200 border border-gray-100"

>

    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div className="text-left">
        <h3 className="font-bold text-gray-800 text-[17px]">{title}</h3>
        {sub && <p className="text-gray-500 text-sm font-medium">{sub}</p>}
      </div>
    </div>
    <ChevronRight size={20} className="text-gray-300" />

  </button>
);

const Input = ({ label, value, onChange, type = "text", placeholder }) => (

  <div className="mb-4">
    <label className="block text-sm font-bold text-gray-500 mb-1 ml-1">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-50 border-none rounded-[16px] p-4 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow placeholder:text-gray-300 placeholder:font-normal"
    />
  </div>
);

// --- Main Application ---
export default function App() {
// Flow State
const [step, setStep] = useState('login'); // login, modeSelect, lobby, game

// Game Data State
const [nickname, setNickname] = useState('');
const [roomCode, setRoomCode] = useState('');
const [myCash, setMyCash] = useState(3000000);
const [myAssets, setMyAssets] = useState(0); // 부동산 등 자산 가치
const [welfareFund, setWelfareFund] = useState(500000); // 사회복지기금 (공용)

// Modal States
const [activeModal, setActiveModal] = useState(null); // 'transfer', 'buy', 'pay', 'donate', 'vote', 'rank'
const [tempAmount, setTempAmount] = useState('');
const [selectedPlayer, setSelectedPlayer] = useState(null);

// Mock Data
const mockPlayers = [
{ id: 1, name: '김토스', cash: 2500000, assets: 1000000 },
{ id: 2, name: '이보드', cash: 1800000, assets: 3200000 },
{ id: 3, name: '박게임', cash: 500000, assets: 500000 },
];

// --- Actions ---

const handleLogin = () => {
if (nickname.trim()) setStep('modeSelect');
};

const createRoom = () => {
setRoomCode(Math.floor(1000 + Math.random() \* 9000).toString());
setStep('lobby');
};

const joinRoom = () => {
// 실제로는 코드 검증 로직 필요
setStep('lobby');
};

const startGame = () => {
setStep('game');
};

// Helper to adjust amount in modal
const adjustAmount = (delta) => {
const current = parseInt(tempAmount.replace(/,/g, '') || '0', 10);
const next = Math.max(0, current + delta);
setTempAmount(next.toLocaleString());
};

// P2P 송금 (Flow: P2P_Exec)
const executeTransfer = () => {
const amount = parseInt(tempAmount.replace(/,/g, ''), 10);
if (!amount || amount <= 0) return alert("올바른 금액을 입력하세요.");
if (amount > myCash) return alert("잔액이 부족합니다.");

    setMyCash(prev => prev - amount);
    // 상대방 현금 증가 로직은 서버 통신 필요 (여기선 생략)
    closeModal();
    alert(`${selectedPlayer.name}님에게 ${amount.toLocaleString()}원을 송금했습니다.`);

};

// 자산 구매 (Flow: AssetExec)
const executeBuyAsset = () => {
const amount = parseInt(tempAmount.replace(/,/g, ''), 10);
if (!amount || amount <= 0) return;
if (amount > myCash) return alert("잔액이 부족합니다.");

    setMyCash(prev => prev - amount);
    setMyAssets(prev => prev + amount);
    closeModal();

};

// 비용 지불 (Flow: ExpExec)
const executePayExpense = () => {
const amount = parseInt(tempAmount.replace(/,/g, ''), 10);
if (!amount || amount <= 0) return;
if (amount > myCash) return alert("잔액이 부족합니다.");

    setMyCash(prev => prev - amount);
    closeModal();

};

// 기부 (Flow: WelExec)
const executeDonate = () => {
const amount = parseInt(tempAmount.replace(/,/g, ''), 10);
if (!amount || amount <= 0) return;
if (amount > myCash) return alert("잔액이 부족합니다.");

    setMyCash(prev => prev - amount);
    setWelfareFund(prev => prev + amount);
    closeModal();
    alert("사회복지기금에 기부했습니다. 따뜻한 마음 감사합니다!");

};

// 기금 수령 투표 시뮬레이션 (Flow: ReqVote -> VoteCheck)
const requestWelfareFund = () => {
if (welfareFund <= 0) return alert("현재 기금이 없습니다.");
setActiveModal('vote_processing');

    // 3초 후 결과 시뮬레이션
    setTimeout(() => {
      // 70% 확률로 성공하도록 설정
      const isApproved = Math.random() > 0.3;

      if (isApproved) {
        setMyCash(prev => prev + welfareFund);
        setWelfareFund(0);
        setActiveModal(null); // Close spinner
        alert("투표 통과! 사회복지기금을 모두 수령했습니다.");
      } else {
        setActiveModal(null);
        alert("투표 거절: 과반수의 동의를 얻지 못했습니다.");
      }
    }, 2500);

};

// 월급 받기 (Flow: SalaryExec)
const receiveSalary = () => {
setMyCash(prev => prev + 200000);
alert("월급 20만원이 입금되었습니다!");
};

const closeModal = () => {
setActiveModal(null);
setTempAmount('');
setSelectedPlayer(null);
};

// --- Renders ---

// 1. 로그인 화면 (Start -> Login)
if (step === 'login') {
return (
<div className="min-h-screen bg-white p-6 flex flex-col justify-center max-w-md mx-auto">
<div className="mb-10 text-center">
<span className="text-blue-600 font-bold text-lg mb-2 block">TOSS GAME BANK</span>
<h1 className="text-3xl font-bold text-gray-900">어떤 이름으로<br/>참여할까요?</h1>
</div>
<Input
label="닉네임"
placeholder="사용할 이름을 입력하세요"
value={nickname}
onChange={(e) => setNickname(e.target.value)}
/>
<div className="mt-8">
<Button onClick={handleLogin} disabled={!nickname.trim()}>시작하기</Button>
</div>
</div>
);
}

// 2. 모드 선택 (SelectMode)
if (step === 'modeSelect') {
return (
<div className="min-h-screen bg-[#f2f4f6] p-6 max-w-md mx-auto">
<header className="pt-8 pb-10">
<h1 className="text-2xl font-bold text-gray-900">환영합니다, {nickname}님!<br/>어떻게 입장하시겠어요?</h1>
</header>
<div className="space-y-4">
<Card onClick={createRoom} className="cursor-pointer active:scale-[0.98] transition-transform">
<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
<Users size={24} />
</div>
<h3 className="text-xl font-bold text-gray-900">방 만들기</h3>
<p className="text-gray-500 mt-1">새로운 게임 방을 생성하고<br/>친구들을 초대합니다.</p>
</Card>
<Card onClick={joinRoom} className="cursor-pointer active:scale-[0.98] transition-transform">
<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-4">
<QrCode size={24} />
</div>
<h3 className="text-xl font-bold text-gray-900">방 들어가기</h3>
<p className="text-gray-500 mt-1">QR코드나 방 번호로<br/>기존 게임에 참여합니다.</p>
</Card>
</div>
</div>
);
}

// 3. 대기실 (CheckReady)
if (step === 'lobby') {
return (
<div className="min-h-screen bg-white p-6 max-w-md mx-auto flex flex-col">
<div className="flex-1 text-center pt-12">
<div className="w-24 h-24 bg-gray-100 mx-auto rounded-2xl flex items-center justify-center mb-6">
<QrCode size={48} className="text-gray-400" />
</div>
<h2 className="text-2xl font-bold text-gray-900 mb-2">대기 중...</h2>
<p className="text-gray-500 mb-8">친구들이 들어오고 있어요</p>

          <div className="bg-[#f2f4f6] rounded-[20px] p-6 text-left">
             <h4 className="text-sm font-bold text-gray-500 mb-4">참여 인원 (4/4)</h4>
             <ul className="space-y-3">
               <li className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">나</div>
                 <span className="font-bold text-gray-800">{nickname}</span>
               </li>
               {mockPlayers.map(p => (
                 <li key={p.id} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">{p.name[0]}</div>
                   <span className="font-medium text-gray-600">{p.name}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
        <div className="pb-6">
          <Button onClick={startGame}>모두 준비 완료!</Button>
        </div>
      </div>
    );

}

// 4. 메인 게임 대시보드 (MainScreen)
return (
<div className="min-h-screen bg-[#f2f4f6] pb-24 font-sans select-none max-w-md mx-auto shadow-xl">
{/_ Header _/}
<header className="px-6 pt-12 pb-4 flex justify-between items-center bg-[#f2f4f6]">
<div className="flex items-center gap-2">
<span className="text-2xl font-bold text-gray-800">toss</span>
<span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-bold">GAME</span>
</div>
<div className="flex gap-4 text-gray-400">
<Bell size={24} />
</div>
</header>

      <main className="px-5">
        {/* Total Asset Info */}
        <Card className="bg-white hover:bg-[#f9fafb] transition-colors relative overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-gray-800 font-bold text-[19px]">내 자산</h2>
            <button
              onClick={() => setActiveModal('rank')}
              className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200"
            >
              <Trophy size={12} /> 순위 보기
            </button>
          </div>
          <p className="text-[28px] font-bold text-gray-900 mb-1">
            {myCash.toLocaleString()} 원
          </p>
          <p className="text-sm text-gray-400 font-medium mb-6">
            부동산 가치: {myAssets.toLocaleString()} 원
          </p>
          <div className="flex gap-3">
            <button
              onClick={receiveSalary}
              className="flex-1 bg-blue-500 text-white py-3 rounded-[14px] font-semibold text-[15px] hover:bg-blue-600 active:scale-[0.98] transition-all shadow-md shadow-blue-100"
            >
              월급 받기 (+20만)
            </button>
          </div>
        </Card>

        {/* Welfare Fund Widget */}
        <div className="bg-white rounded-[24px] p-5 mb-6 flex items-center justify-between shadow-sm">
           <div>
             <h4 className="text-xs font-bold text-gray-400 mb-1">사회복지기금</h4>
             <p className="text-xl font-bold text-blue-600">{welfareFund.toLocaleString()}원</p>
           </div>
           <button
             onClick={requestWelfareFund}
             disabled={welfareFund === 0}
             className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-[12px] text-sm font-bold disabled:opacity-50"
           >
             수령 신청
           </button>
        </div>

        {/* UserAction Section */}
        <div className="mb-3 px-1">
          <h3 className="text-[19px] font-bold text-gray-800">송금 및 결제</h3>
        </div>

        {/* P2P Transfer */}
        <ActionButton
          icon={ArrowRightLeft}
          title="플레이어에게 송금"
          sub="통행료 지불 등"
          colorClass="bg-blue-100 text-blue-600"
          onClick={() => setActiveModal('transfer_select_user')}
        />

        {/* Bank Actions */}
        <ActionButton
          icon={Landmark}
          title="자산 구매"
          sub="땅, 건물 등 (자산가치 상승)"
          onClick={() => setActiveModal('buy_asset')}
        />
        <ActionButton
          icon={CreditCard}
          title="단순 비용 지불"
          sub="벌금, 은행 수수료 등 (소멸)"
          onClick={() => setActiveModal('pay_expense')}
        />
        <ActionButton
          icon={HandCoins}
          title="사회복지기금 기부"
          sub="좋은 곳에 쓰입니다"
          onClick={() => setActiveModal('donate')}
        />

      </main>

      {/* --- Modals --- */}

      {/* 1. Select User for Transfer */}
      {activeModal === 'transfer_select_user' && (
        <BottomSheet title="누구에게 보낼까요?" onClose={closeModal}>
          <div className="space-y-2">
            {mockPlayers.map(player => (
              <button
                key={player.id}
                onClick={() => { setSelectedPlayer(player); setActiveModal('transfer_input'); }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[16px] hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                    {player.name[0]}
                  </div>
                  <span className="font-bold text-gray-800">{player.name}</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* 2. Amount Input (Used for Transfer, Buy, Pay, Donate) */}
      {(activeModal === 'transfer_input' || activeModal === 'buy_asset' || activeModal === 'pay_expense' || activeModal === 'donate') && (
        <BottomSheet
          title={
            activeModal === 'transfer_input' ? `${selectedPlayer?.name}님에게 송금` :
            activeModal === 'buy_asset' ? '자산 구매 (은행)' :
            activeModal === 'pay_expense' ? '비용 지불 (은행)' : '기부금 납부'
          }
          onClose={closeModal}
        >
          <div className="mb-6">
            <input
              type="text"
              inputMode="numeric"
              value={tempAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setTempAmount(val ? Number(val).toLocaleString() : '');
              }}
              placeholder="얼마를 보낼까요?"
              autoFocus
              className="w-full text-3xl font-bold text-center border-b-2 border-gray-200 py-4 focus:border-blue-500 outline-none bg-transparent placeholder:text-gray-300"
            />

            {/* Amount Adjustment Buttons */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => adjustAmount(100000)} className="py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all">+10만</button>
                <button onClick={() => adjustAmount(50000)} className="py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all">+5만</button>
                <button onClick={() => adjustAmount(10000)} className="py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all">+1만</button>
                <button onClick={() => adjustAmount(5000)} className="py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all">+5천</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => adjustAmount(-100000)} className="py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 active:scale-95 transition-all">-10만</button>
                <button onClick={() => adjustAmount(-50000)} className="py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 active:scale-95 transition-all">-5만</button>
                <button onClick={() => adjustAmount(-10000)} className="py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 active:scale-95 transition-all">-1만</button>
                <button onClick={() => adjustAmount(-5000)} className="py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 active:scale-95 transition-all">-5천</button>
              </div>
            </div>

            {/* Quick Amount Selection for Donation (Preserved) */}
            {activeModal === 'donate' && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => setTempAmount('150,000')}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold hover:bg-blue-100 transition-colors active:scale-95 border border-blue-100"
                >
                  15만원 바로 입력
                </button>
              </div>
            )}

            <p className="text-center text-gray-400 mt-4 text-sm">
              내 잔액: {myCash.toLocaleString()}원
            </p>
          </div>
          <Button onClick={
            activeModal === 'transfer_input' ? executeTransfer :
            activeModal === 'buy_asset' ? executeBuyAsset :
            activeModal === 'pay_expense' ? executePayExpense :
            executeDonate
          }>
            보내기
          </Button>
        </BottomSheet>
      )}

      {/* 3. Voting Simulation Modal */}
      {activeModal === 'vote_processing' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-8 text-center animate-fade-in">
             <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-6" />
             <h3 className="text-xl font-bold text-gray-900 mb-2">동의 요청 중...</h3>
             <p className="text-gray-500">
               다른 플레이어들에게<br/>수령 동의를 받고 있습니다.
             </p>
          </div>
        </div>
      )}

      {/* 4. Ranking Modal */}
      {activeModal === 'rank' && (
        <BottomSheet title="실시간 자산 순위" onClose={closeModal}>
          <div className="space-y-4">
             {/* Me */}
             <div className="flex items-center justify-between p-4 bg-blue-50 rounded-[16px] border border-blue-100">
                <div className="flex items-center gap-3">
                   <span className="font-bold text-blue-600 w-4">?</span>
                   <span className="font-bold text-gray-900">{nickname} (나)</span>
                </div>
                <div className="text-right">
                   <p className="font-bold text-gray-900">{(myCash + myAssets).toLocaleString()}원</p>
                   <p className="text-xs text-blue-500">현금 + 부동산</p>
                </div>
             </div>
             {/* Others (Sorted logic needed in real app) */}
             {mockPlayers.map((p, idx) => (
               <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[16px]">
                  <div className="flex items-center gap-3">
                     <span className="font-bold text-gray-400 w-4">{idx + 1}</span>
                     <span className="font-medium text-gray-700">{p.name}</span>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-gray-800">{(p.cash + p.assets).toLocaleString()}원</p>
                  </div>
               </div>
             ))}
          </div>
        </BottomSheet>
      )}

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>

);
}

// Helper UI: Bottom Sheet Modal
const BottomSheet = ({ title, children, onClose }) => (

  <div className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
    <div className="w-full max-w-sm bg-white rounded-t-[24px] sm:rounded-[24px] p-6 pb-10 shadow-2xl animate-slide-up sm:m-4 relative">
      <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);
