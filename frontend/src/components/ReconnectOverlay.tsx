import React from 'react';

interface Props {
  attempts: number;
  maxAttempts: number;
  onRefresh: () => void;
  failed?: boolean;
}

/**
 * Reconnect Overlay Component (T054)
 * Shows reconnection progress when connection is lost
 */
export const ReconnectOverlay: React.FC<Props> = ({
  attempts,
  maxAttempts,
  onRefresh,
  failed = false
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {!failed ? (
          <>
            {/* Reconnecting state */}
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              연결 끊김
            </h2>
            
            <p className="text-slate-400 mb-4">
              재연결 시도 중... ({attempts}/{maxAttempts})
            </p>
            
            <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(attempts / maxAttempts) * 100}%` }}
              />
            </div>
            
            <p className="text-sm text-slate-500">
              네트워크 연결을 확인해주세요
            </p>
          </>
        ) : (
          <>
            {/* Failed state */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              연결 실패
            </h2>
            
            <p className="text-slate-400 mb-6">
              서버에 연결할 수 없습니다.<br/>
              새로고침하여 재접속해주세요.
            </p>
            
            <button
              onClick={onRefresh}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              새로고침
            </button>
          </>
        )}
      </div>
    </div>
  );
};
