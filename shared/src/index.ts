
// T001: BuildingType for building classification
export type BuildingType = 'HOTEL' | 'BUILDING' | 'VILLA';

export interface Asset {
  id: string;
  type: 'LAND' | 'BUILDING';
  buildingType?: BuildingType; // T002: Building type (only for type === 'BUILDING')
  name?: string;
  value: number;
  createdAt: number;
  landId?: string; // NEW: 건물이 위치한 토지 ID (건물인 경우)
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

// T001: TransactionType 확장 (BANK_RECEIVE, SELL_ASSET 추가)
export type TransactionType = 
  | 'TRANSFER'        // 플레이어 간 송금
  | 'BUY_ASSET'       // 부동산 매입
  | 'PAY_COST'        // 은행에 납부
  | 'DONATE'          // 복지기금 기부
  | 'SALARY'          // 월급 수령
  | 'WELFARE_RECEIVE' // 복지기금 수령
  | 'BANK_RECEIVE'    // 은행 수령 (복권, 우승상금 등) [NEW]
  | 'SELL_ASSET';     // 자산 매각 (반액 대매출) [NEW]

// T002: BankReceiveReason 타입 추가
export type BankReceiveReason =
  | 'LOTTERY'       // 복권
  | 'PRIZE'         // 우승상금
  | 'BONUS'         // 보너스
  | 'OTHER';        // 기타 (customReason 필드 사용)

// T003: TransactionStatus 타입 추가 (거래 취소 기능)
export type TransactionStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING_CANCEL';

// T003: Transaction 인터페이스 확장 (reason, soldAsset, status 필드 추가)
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  timestamp: number;
  description?: string;
  // NEW: 은행 수령 사유 (BANK_RECEIVE 타입일 때)
  reason?: BankReceiveReason | string;
  // NEW: 매각된 자산 정보 (SELL_ASSET 타입일 때)
  soldAsset?: {
    assetId: string;
    assetName: string;
    originalValue: number;
  };
  // NEW: 거래 상태
  status: TransactionStatus;
  // NEW: 취소 관련 정보
  cancelledAt?: number;
  cancelledBy?: string;
}

// NEW: 거래 취소 요청 인터페이스
export interface CancelRequest {
  id: string;
  transactionId: string;
  requesterId: string;      // 취소 요청자
  targetId: string;         // 상대방 (동의 필요)
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;        // 60초 후
  respondedAt?: number;
}

export type VoteStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

// T005: VoteType 확장 (BANK_RECEIVE 추가)
export type VoteType = 'WELFARE' | 'GAME_END' | 'BANK_RECEIVE';

export interface Vote {
  id: string;
  roomId: string;
  requesterId: string;
  voteType?: VoteType;  // NEW: 투표 유형
  amount: number;
  status: VoteStatus;
  votes: Record<string, boolean>; // userId -> approve(true)/reject(false)
  createdAt: number;
  expiresAt: number;
  timeoutHandledAs?: 'REJECT';  // NEW: 미응답 처리 방식 (모든 투표 거절로 통일)
  reason?: BankReceiveReason | string;  // NEW: 은행 수령 사유 (BANK_RECEIVE 투표일 때)
}

// T004: NotificationType, Notification 인터페이스 추가
export type NotificationType =
  | 'TRANSFER_RECEIVED'   // 송금 수신
  | 'BANK_RECEIVED'       // 은행 수령
  | 'VOTE_STARTED'        // 투표 시작
  | 'VOTE_ENDED'          // 투표 종료
  | 'GAME_END_REQUESTED'  // 게임 종료 투표 시작
  | 'GAME_ENDED';         // 게임 종료

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  targetPlayerId: string;
  read: boolean;
  timestamp: number;
  // 관련 데이터 (선택적)
  relatedData?: {
    transactionId?: string;
    voteId?: string;
    fromPlayerName?: string;
    amount?: number;
  };
}

// T005: GameEndVote 인터페이스 추가
export interface GameEndVote {
  id: string;
  roomId: string;
  requesterId: string;          // 호스트 ID
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';  // CANCELLED 추가
  votes: Record<string, boolean | null>;  // null = 미응답
  createdAt: number;
  expiresAt: number;            // 60초 후
  timeoutHandledAs: 'REJECT';   // 미응답 처리 방식: 'APPROVE' → 'REJECT' 변경
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
  // Connection events
  'connection:status': (payload: ConnectionStatusPayload) => void;
  'host:migrating': (payload: HostMigratingPayload) => void;
  'host:migrated': (payload: HostMigratedPayload) => void;
  'host:migration_cancelled': (payload: { hostId: string, hostNickname: string }) => void;
  'player:kicked': (payload: PlayerKickedPayload) => void;
  'player:rejoined': (payload: { playerId: string, nickname: string }) => void;
  // T006: 새 이벤트 타입 추가
  'notification:received': (notification: Notification) => void;
  'notification:count': (count: number) => void;
  'transaction:history': (transactions: Transaction[]) => void;
  'game_end_vote:started': (vote: GameEndVote) => void;
  'game_end_vote:updated': (vote: GameEndVote) => void;
  'game_end_vote:ended': (vote: GameEndVote) => void;
  // NEW: 게임 종료 투표 취소
  'game_end_vote:cancelled': (payload: { voteId: string; cancelledBy: string }) => void;
  // NEW: 거래 취소 이벤트
  'tx:cancel_requested': (request: CancelRequest) => void;
  'tx:cancel_responded': (request: CancelRequest) => void;
  'tx:cancelled': (transaction: Transaction) => void;
  // NEW: 은행 수령 투표 이벤트
  'bank_receive_vote:started': (vote: Vote) => void;
  'bank_receive_vote:updated': (vote: Vote) => void;
  'bank_receive_vote:ended': (vote: Vote) => void;
  // NEW: 자산명 변경
  'asset:renamed': (payload: { playerId: string; assetId: string; oldName: string; newName: string }) => void;
}

// T007: ClientToServerEvents에 새 이벤트 타입 추가
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
  // Connection events
  'connection:heartbeat': () => void;
  'room:rejoin': (roomId: string, nickname: string, callback: (response: { success: boolean, message?: string }) => void) => void;
  'player:kick': (playerId: string, callback: (response: { success: boolean, message?: string }) => void) => void;
  // NEW: 거래 내역 조회 요청
  'transaction:get_history': (callback: (transactions: Transaction[]) => void) => void;
  // NEW: 은행 수령 요청 (호스트 전용)
  'tx:bank_receive': (
    payload: {
      targetPlayerId: string;
      amount: number;
      reason: BankReceiveReason;
      customReason?: string;  // reason이 'OTHER'일 때
    },
    callback: (response: { success: boolean; message?: string }) => void
  ) => void;
  // NEW: 자산 매각 요청
  // Task 4.2: bundleSell 옵션 추가 (토지 매각 시 건물 일괄 처리)
  'tx:sell_asset': (
    payload: { assetId: string; bundleSell?: boolean },
    callback: (response: { success: boolean; message?: string; receivedAmount?: number }) => void
  ) => void;
  // NEW: 게임 종료 투표 요청 (호스트 전용)
  'game:request_end': (roomId: string, callback: (response: { success: boolean; error?: string; voteId?: string }) => void) => void;
  // NEW: 게임 종료 투표 응답
  'game_end_vote:cast': (voteId: string, approve: boolean, callback: (response: { success: boolean; error?: string }) => void) => void;
  // T004: 게임 종료 투표 취소
  'game_end_vote:cancel': (voteId: string, callback: (response: { success: boolean; error?: string }) => void) => void;
  // NEW: 알림 읽음 처리
  'notification:mark_read': (notificationId: string, callback?: (response: { success: boolean }) => void) => void;
  'notification:mark_all_read': (callback?: (response: { success: boolean; count?: number }) => void) => void;
  // NEW: 알림 조회
  'notification:get_list': (callback: (notifications: Notification[]) => void) => void;
  'notification:get_unread_count': (callback: (count: number) => void) => void;
  // NEW: 거래 취소 요청
  'tx:request_cancel': (transactionId: string, callback: (response: { success: boolean; error?: string; requestId?: string }) => void) => void;
  // NEW: 거래 취소 응답
  'tx:respond_cancel': (requestId: string, approve: boolean, callback: (response: { success: boolean; error?: string }) => void) => void;
  // NEW: 은행 수령 투표 요청
  'vote:request_bank_receive': (payload: { amount: number; reason: BankReceiveReason; customReason?: string }, callback: (response: { success: boolean; error?: string; voteId?: string }) => void) => void;
  // NEW: 자산명 변경
  'asset:rename': (assetId: string, newName: string, callback: (response: { success: boolean; error?: string }) => void) => void;
}

