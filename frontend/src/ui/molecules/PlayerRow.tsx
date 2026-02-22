import React from 'react';
import type { Player } from '@blue-banker/shared';
import { StatusDot } from '../atoms';

interface Props {
  player: Player;
  right?: React.ReactNode;
  className?: string;
}

export const PlayerRow: React.FC<Props> = ({ player, right, className = '' }) => (
  <div className={`flex items-center justify-between bg-slate-700/50 p-3 rounded-lg ${className}`}>
    <span className="font-medium flex items-center gap-2">
      <StatusDot status={player.connectionStatus || 'ONLINE'} />
      {player.nickname}
    </span>
    {right}
  </div>
);
