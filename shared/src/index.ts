
// T001: BuildingType for building classification
export type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';

export interface Asset {
  id: string;
  type: 'LAND' | 'BUILDING';
  buildingType?: BuildingType; // T002: Building type (only for type === 'BUILDING')
  name?: string;
  value: number;
  createdAt: number;
}

// Connection Status Types (T001)
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

// Connection Payload Types (T002-T004)
export interface ConnectionStatusPayload {
  playerId: string;
  status: ConnectionStatus;
  nickname: string;
}

export interface HostMigratingPayload {
  disconnectedHostId: string;
  remainingSeconds: number;
}

export interface HostMigratedPayload {
  oldHostId: string;
  newHostId: string;
  newHostNickname: string;
}

export interface PlayerKickedPayload {
  playerId: string;
  nickname: string;
}

// Extended Player interface (T008)
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
  connectionStatus: ConnectionStatus; // [NEW] Connection status
  lastSeenAt: number; // [NEW] Last activity timestamp
  disconnectedAt: number | null; // [NEW] Disconnect timestamp
}

// DisconnectedSession interface (T009)
export interface DisconnectedSession {
  nickname: string;
  roomId: string;
  cash: number;
  assetValue: number;
  assets: Asset[];
  disconnectedAt: number;
  expiresAt: number;
  originalSocketId: string;
}

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'ENDED';

export interface Room {
  id: string; // 6-char code
  status: RoomStatus;
  players: Player[]; // Transferred as array
  welfareFund: number;
  hostId: string;
  createdAt: number; // timestamp
  pendingHostMigration?: boolean; // [NEW] Host migration pending flag
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

// Socket Events (T005-T006)
export interface ServerToClientEvents {
  'room:sync': (room: Room) => void;
  'game:started': () => void;
  'game:ended': (payload: GameEndedPayload) => void;
  'tx:processed': (tx: Transaction) => void;
  'vote:started': (vote: Vote) => void;
  'vote:updated': (vote: Vote) => void;
  'vote:ended': (vote: Vote) => void;
  'error': (message: string) => void;
  // Connection events (NEW)
  'connection:status': (payload: ConnectionStatusPayload) => void;
  'host:migrating': (payload: HostMigratingPayload) => void;
  'host:migrated': (payload: HostMigratedPayload) => void;
  'host:migration_cancelled': (payload: { hostId: string, hostNickname: string }) => void;
  'player:kicked': (payload: PlayerKickedPayload) => void;
  'player:rejoined': (payload: { playerId: string, nickname: string }) => void;
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
      buildingType?: BuildingType; // T003: Building type for BUY_ASSET
  }, callback?: (response: { success: boolean, txId?: string, error?: string }) => void) => void;
  'vote:request_fund': (amount: number) => void;
  'vote:cast': (voteId: string, approve: boolean) => void;
  // Connection events (NEW)
  'connection:heartbeat': () => void;
  'room:rejoin': (roomId: string, nickname: string, callback: (response: { success: boolean, message?: string }) => void) => void;
  'player:kick': (playerId: string, callback: (response: { success: boolean, message?: string }) => void) => void;
}

