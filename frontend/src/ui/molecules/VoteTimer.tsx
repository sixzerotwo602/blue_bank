import React from 'react';

interface Props {
  remainingTime: number;
}

export const VoteTimer: React.FC<Props> = ({ remainingTime }) => (
  <div className="bg-slate-800 rounded-xl p-4 text-center">
    <div className="text-slate-400 text-sm mb-1">남은 시간</div>
    <div className={`text-4xl font-mono font-bold ${remainingTime <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
      {remainingTime}초
    </div>
    <div className="text-slate-500 text-xs mt-1">시간 초과 시 미응답은 거절로 처리됩니다</div>
  </div>
);
