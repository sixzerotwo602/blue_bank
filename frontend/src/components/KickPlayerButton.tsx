import React from 'react';
import type { Player } from '@blue-banker/shared';

interface Props {
  player: Player;
  onKick: (playerId: string) => void;
  isHost: boolean;
}

// 5 minutes in milliseconds
const KICK_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Kick Player Button Component (T048)
 * Shows button to kick offline players (host only, 5+ min offline)
 */
export const KickPlayerButton: React.FC<Props> = ({
  player,
  onKick,
  isHost
}) => {
  // Check if player is kickable (5+ minutes offline)
  const isKickable = (): boolean => {
    if (!isHost) return false;
    if (player.connectionStatus !== 'OFFLINE') return false;
    if (!player.disconnectedAt) return false;

    const offlineTime = Date.now() - player.disconnectedAt;
    return offlineTime >= KICK_THRESHOLD_MS;
  };

  if (!isKickable()) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onKick(player.id);
  };

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
      title="5분 이상 오프라인 - 강제 퇴장 가능"
    >
      퇴장
    </button>
  );
};
