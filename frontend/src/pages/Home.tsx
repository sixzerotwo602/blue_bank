import React, { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { Button } from '@/design-system/foundations';
import { Input } from '@/design-system/foundations';

export const Home: React.FC = () => {
  const { createRoom, joinRoom, connected } = useGame(); // No roomId needed here
  const [nickname, setNickname] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isJoinMode, setIsJoinMode] = useState(false);

  const handleCreate = () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요.');
    if (!connected) return alert('서버에 연결되지 않았습니다.');
    createRoom(nickname);
  };

  const handleJoin = () => {
    if (!nickname.trim() || !roomIdInput.trim()) return alert('정보를 모두 입력해주세요.');
    if (!connected) return alert('서버에 연결되지 않았습니다.');
    joinRoom(roomIdInput, nickname);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
          Blue Banker
        </h1>
        <p className="text-blue-200 mb-8">모바일 컴패니언 앱</p>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="닉네임"
            className="w-full"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          {!isJoinMode ? (
            <div className="space-y-3">
              <Button
                onClick={handleCreate}
                variant="primary"
                size="md"
                className="w-full"
              >
                새로운 게임 (방 생성)
              </Button>
              <Button
                onClick={() => setIsJoinMode(true)}
                variant="secondary"
                size="md"
                className="w-full"
              >
                방 코드로 입장
              </Button>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <Input
                type="text"
                placeholder="방 코드 (6자리)"
                className="w-full uppercase"
                maxLength={6}
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              />
              <Button
                onClick={handleJoin}
                variant="primary"
                size="md"
                className="w-full bg-success hover:bg-green-500"
              >
                입장하기
              </Button>
              <button
                onClick={() => setIsJoinMode(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                뒤로가기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
