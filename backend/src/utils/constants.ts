// 투표 타임아웃 (60초)
export const VOTE_TIMEOUT_MS = 60_000;

// 거래 취소 요청 만료 (60초)
export const CANCEL_REQUEST_TIMEOUT_MS = 60_000;

// 호스트 마이그레이션 대기 (2분)
export const HOST_MIGRATION_DELAY_MS = 120_000;

// 거래 취소 가능 시간 제한 (2분)
export const CANCEL_TIME_LIMIT_MS = 120_000;

// 세션 만료 시간 (5분)
export const SESSION_EXPIRY_MS = 300_000;

// 게임 종료 후 방 정리 대기 (5분)
export const ROOM_CLEANUP_DELAY_MS = 300_000;

// 세션 정리 주기 (1분)
export const SESSION_CLEANUP_INTERVAL_MS = 60_000;

// 킥 가능 유예 시간 (5분)
export const KICK_GRACE_PERIOD_MS = 300_000;

// 금액·문자열 제한
export const MAX_AMOUNT = 1_000_000_000;       // 10억
export const MAX_NICKNAME_LENGTH = 20;
export const MAX_ASSET_NAME_LENGTH = 20;
export const MAX_PLAYERS_PER_ROOM = 10;
export const MAX_ROOMS_PER_IP = 5;
export const MAX_ROOM_AGE_MS = 24 * 60 * 60 * 1000; // 24시간

// Rate Limiting (이벤트 유형별)
export const RATE_LIMITS = {
  ROOM_JOIN:    { maxRequests: 20,  windowMs: 60_000 },
  ROOM_CREATE:  { maxRequests: 5,   windowMs: 300_000 },
  TRANSACTION:  { maxRequests: 60,  windowMs: 60_000 },
  VOTE:         { maxRequests: 30,  windowMs: 60_000 },
  GENERAL:      { maxRequests: 100, windowMs: 60_000 },
} as const;
