import React, { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { HomeTemplate, BaseButton, TextInput } from '../ui';

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
    <HomeTemplate>
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
          Blue Bank
        </h1>
        <p className="text-blue-200 mb-8">모바일 컴패니언 앱</p>

        <div className="space-y-4">
          <TextInput
            type="text"
            placeholder="닉네임"
            className="bg-slate-800/50 border-slate-600 transition-colors"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          {!isJoinMode ? (
            <div className="space-y-3">
              <BaseButton
                onClick={handleCreate}
                fullWidth
                className="shadow-lg hover:shadow-blue-500/30"
              >
                새로운 게임 (방 생성)
              </BaseButton>
              <BaseButton
                onClick={() => setIsJoinMode(true)}
                variant="secondary"
                fullWidth
              >
                방 코드로 입장
              </BaseButton>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <TextInput
                type="text"
                placeholder="방 코드 (6자리)"
                className="bg-slate-800/50 border-slate-600 transition-colors uppercase"
                maxLength={6}
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              />
              <BaseButton
                onClick={handleJoin}
                variant="success"
                fullWidth
                className="shadow-lg hover:shadow-green-500/30"
              >
                입장하기
              </BaseButton>
              <BaseButton
                onClick={() => setIsJoinMode(false)}
                variant="ghost"
                fullWidth
                className="text-slate-400 hover:text-white text-sm"
              >
                뒤로가기
              </BaseButton>
            </div>
          )}
        </div>
      </div>
    </HomeTemplate>
  );
};
