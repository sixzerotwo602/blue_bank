import React from 'react';
import type { ConnectionStatus as ConnectionStatusType } from '@blue-banker/shared';

interface Props {
  status: ConnectionStatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Connection Status Indicator Component (T019)
 * Displays player connection status with color-coded icon
 */
export const ConnectionStatus: React.FC<Props> = ({ 
  status, 
  showLabel = false,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusConfig = {
    ONLINE: {
      color: 'bg-green-500',
      label: '온라인',
      animate: ''
    },
    OFFLINE: {
      color: 'bg-red-500',
      label: '오프라인',
      animate: ''
    },
    RECONNECTING: {
      color: 'bg-yellow-500',
      label: '재연결 중',
      animate: 'animate-pulse'
    }
  };

  const config = statusConfig[status] || statusConfig.OFFLINE;

  return (
    <div className="flex items-center gap-1.5">
      <span 
        className={`
          ${sizeClasses[size]} 
          ${config.color} 
          ${config.animate}
          rounded-full 
          inline-block
        `}
        title={config.label}
      />
      {showLabel && (
        <span className={`text-xs ${
          status === 'ONLINE' ? 'text-green-400' :
          status === 'OFFLINE' ? 'text-red-400' :
          'text-yellow-400'
        }`}>
          {config.label}
        </span>
      )}
    </div>
  );
};
