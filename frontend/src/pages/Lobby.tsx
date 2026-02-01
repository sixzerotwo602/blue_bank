import React from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket'; // Still need useSocket for socket.id check (or expose myId from useGame)
import type { Player } from '@blue-banker/shared';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { MAX_AMOUNT } from '../utils/constants';
import toast from 'react-hot-toast';

export const Lobby: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, startGame } = useGame(roomId);
  const { socket } = useSocket(); 
  const customInputRef = React.useRef<HTMLInputElement>(null);

  if (!room) {
     return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
           <p>방 정보를 불러오는 중...(또는 입장이 필요합니다)</p>
        </div>
     );
  }

  const amIHost = room.hostId === socket?.id;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
            <h2 className="text-xl text-slate-400">대기실</h2>
            <h1 className="text-5xl font-mono font-bold text-blue-400 tracking-wider my-2">{room.id}</h1>
            <p className="text-sm text-slate-500">위 코드를 친구에게 공유하세요</p>
        </header>

        <div className="bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">참가자 ({room.players.length})</h3>
            <ul className="space-y-2">
                {room.players.map((p: Player) => (
                    <li key={p.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                        <span className="font-medium flex items-center gap-2">
                            {/* Connection Status Indicator (T021) */}
                            <ConnectionStatus status={p.connectionStatus || 'ONLINE'} />
                            {p.nickname}
                            {p.isHost && <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded">HOST</span>}
                            {p.id === socket?.id && <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded">ME</span>}
                        </span>
                        <span className={p.connectionStatus === 'ONLINE' || p.connected ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                            {p.connectionStatus === 'ONLINE' || p.connected ? '대기 중' : p.connectionStatus === 'RECONNECTING' ? '재연결 중' : '연결 끊김'}
                        </span>
                    </li>
                ))}
            </ul>
        </div>

        {amIHost ? (
            <div className="space-y-3">
                <button
                  onClick={() => startGame(2930000)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-xl transition-all active:scale-95"
                >
                    3-4인 시작 (293만원)
                </button>
                <button
                  onClick={() => startGame(5860000)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl transition-all active:scale-95"
                >
                    2인 시작 (586만원)
                </button>
                <div className="relative border-t border-slate-700 pt-3 mt-3">
                    <p className="text-sm text-slate-400 mb-2">또는 직접 입력 (최대 100조원)</p>
                    <div className="flex gap-2">
                        <input
                            ref={customInputRef}
                            type="number"
                            placeholder="금액(원)"
                            max={MAX_AMOUNT}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={() => {
                                const val = parseInt(customInputRef.current?.value || '0');
                                if (val <= 0) {
                                    toast.error('올바른 금액을 입력하세요');
                                    return;
                                }
                                if (val > MAX_AMOUNT) {
                                    toast.error('금액은 100조 원을 초과할 수 없습니다');
                                    return;
                                }
                                startGame(val);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold text-white whitespace-nowrap shadow-lg transition-all active:scale-95"
                        >
                            시작
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="text-center p-4 bg-slate-800/50 rounded-xl text-slate-400 animate-pulse">
                호스트가 게임을 시작하기를 기다리고 있습니다...
            </div>
        )}
      </div>
    </div>
  );
};
