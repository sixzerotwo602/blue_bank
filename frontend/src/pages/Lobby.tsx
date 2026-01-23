import React from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket'; // Still need useSocket for socket.id check (or expose myId from useGame)
import type { Player } from '@blue-banker/shared';

export const Lobby: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, startGame } = useGame(roomId);
  const { socket } = useSocket(); // To check amIHost

  // Request initial sync? Or rely on join broadcast?
  // If we refreshed page, we are disconnected.
  // We need "reconnect" or "getRoom" logic. TBD.
  // For now assume came from Home.

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
                            {p.nickname}
                            {p.isHost && <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded">HOST</span>}
                            {p.id === socket?.id && <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded">ME</span>}
                        </span>
                        <span className={p.connected ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                            {p.connected ? '대기 중' : '연결 끊김'}
                        </span>
                    </li>
                ))}
            </ul>
        </div>

        {amIHost ? (
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl transition-all active:scale-95"
            >
                게임 시작
            </button>
        ) : (
            <div className="text-center p-4 bg-slate-800/50 rounded-xl text-slate-400 animate-pulse">
                호스트가 게임을 시작하기를 기다리고 있습니다...
            </div>
        )}
      </div>
    </div>
  );
};
