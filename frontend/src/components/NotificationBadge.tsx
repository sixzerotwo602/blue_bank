import React from 'react';

interface Props {
  count: number;
  onClick?: () => void;
  className?: string;
}

/**
 * T032: NotificationBadge 컴포넌트
 * 읽지 않은 알림 수를 표시하는 뱃지
 */
export const NotificationBadge: React.FC<Props> = ({ count, onClick, className = '' }) => {
  if (count === 0) {
    return (
      <button
        onClick={onClick}
        className={`relative p-2 text-slate-400 hover:text-slate-200 transition-colors ${className}`}
      >
        <span className="text-lg">🔔</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-slate-200 hover:text-white transition-colors ${className}`}
    >
      <span className="text-lg">🔔</span>
      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
        {count > 99 ? '99+' : count}
      </span>
    </button>
  );
};
