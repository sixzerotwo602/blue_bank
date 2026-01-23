
export interface Asset {
  id: string;
  type: 'LAND' | 'BUILDING';
  name?: string;
  value: number;
  createdAt: number;
}

export interface Player {
  id: string; // GUID or Socket ID
  nickname: string;
  cash: number;
  assetValue: number;
  assets: Asset[]; // [NEW] List of owned assets
  roomId: string; // Current Room ID
  isReady: boolean;
  isHost: boolean;
  connected: boolean;
}

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'ENDED';

export interface Room {
  id: string; // 6-char code
  status: RoomStatus;
  players: Player[]; // Transferred as array
  welfareFund: number;
  hostId: string;
  createdAt: number; // timestamp
}

export type TransactionType = 'TRANSFER' | 'BUY_ASSET' | 'PAY_COST' | 'DONATE' | 'SALARY' | 'WELFARE_RECEIVE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  timestamp: number;
  description?: string;
}

export type VoteStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

export interface Vote {
  id: string;
  roomId: string;
  requesterId: string;
  amount: number;
  status: VoteStatus;
  votes: Record<string, boolean>; // userId -> approve(true)/reject(false)
  createdAt: number;
  expiresAt: number;
}

export interface Ranking {
  id: string;
  nickname: string;
  cash: number;
  assetValue: number;
  totalAssets: number;
  rank: number;
}

export interface GameEndedPayload {
  rankings: Ranking[];
}

// Socket Events
export interface ServerToClientEvents {
  'room:sync': (room: Room) => void;
  'game:started': () => void;
  'game:ended': (payload: GameEndedPayload) => void;
  'tx:processed': (tx: Transaction) => void;
  'vote:started': (vote: Vote) => void;
  'vote:updated': (vote: Vote) => void;
  'vote:ended': (vote: Vote) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'room:create': (nickname: string, callback: (response: { roomId: string }) => void) => void;
  'room:join': (roomId: string, nickname: string, callback: (response: { success: boolean, message?: string }) => void) => void;
  'room:get': (roomId: string, callback: (response: { room?: Room, error?: string }) => void) => void;
  'game:start': (initialCash: number) => void;
  'game:end': (roomId: string) => void;
  'tx:request': (tx: {
      type: TransactionType;
      amount: number;
      toId?: string;
      assetType?: 'LAND' | 'BUILDING';
  }, callback?: (response: { success: boolean, txId?: string, error?: string }) => void) => void;
  'vote:request_fund': (amount: number) => void;
  'vote:cast': (voteId: string, approve: boolean) => void;
}
