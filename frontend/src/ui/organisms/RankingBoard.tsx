import React from 'react';
import type { Player } from '@blue-banker/shared';
import { RankingList } from '../../features/ranking';

interface Props {
  players: Player[];
  currentUserId?: string;
  isHost?: boolean;
  onKick?: (playerId: string) => void;
  onRenameAsset?: (assetId: string, newName: string) => void;
}

export const RankingBoard: React.FC<Props> = (props) => <RankingList {...props} />;
