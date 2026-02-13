import { z } from 'zod';
import { MAX_AMOUNT, MAX_NICKNAME_LENGTH, MAX_ASSET_NAME_LENGTH } from './constants.js';

// 공통 스키마
const safeAmount = z.number().refine(
  (val) => Number.isFinite(val) && Number.isInteger(val) && val >= 0 && val <= MAX_AMOUNT,
  { message: `유효한 금액을 입력해주세요 (0 ~ ${MAX_AMOUNT})` }
);

const positiveAmount = z.number().refine(
  (val) => Number.isFinite(val) && Number.isInteger(val) && val > 0 && val <= MAX_AMOUNT,
  { message: `금액은 1 이상 ${MAX_AMOUNT} 이하여야 합니다` }
);

const nickname = z.string().trim().min(1, '닉네임을 입력해주세요').max(MAX_NICKNAME_LENGTH, `닉네임은 ${MAX_NICKNAME_LENGTH}자 이하여야 합니다`);

const roomId = z.string().length(6, '방 코드는 6자리여야 합니다').regex(/^[A-Z0-9]{6}$/, '방 코드 형식이 올바르지 않습니다');

const uuid = z.string().min(1, 'ID가 필요합니다');

const transactionType = z.enum([
  'TRANSFER', 'BUY_ASSET', 'SELL_ASSET', 'PAY_COST',
  'DONATE', 'SALARY', 'WELFARE_RECEIVE', 'BANK_RECEIVE'
]);

const bankReceiveReason = z.enum(['LOTTERY', 'PRIZE', 'BONUS', 'OTHER']);

// 이벤트별 스키마
const schemas: Record<string, z.ZodType> = {
  'room:create': z.object({
    nickname,
  }),

  'room:join': z.object({
    roomId,
    nickname,
  }),

  'room:get': z.object({
    roomId,
  }),

  'game:start': z.object({
    initialCash: safeAmount,
  }),

  'tx:request': z.object({
    type: transactionType,
    amount: safeAmount,
    toId: z.string().optional(),
    assetType: z.enum(['LAND', 'BUILDING']).optional(),
    buildingType: z.enum(['HOTEL', 'BUILDING', 'VILLA']).optional(),
    reason: z.string().optional(),
    bundleSell: z.boolean().optional(),
    landName: z.string().max(MAX_ASSET_NAME_LENGTH).optional(),
    selectedLandId: z.string().optional(),
    villaCount: z.number().int().min(1).max(2).optional(),
  }),

  'vote:cast': z.object({
    voteId: uuid,
    approve: z.boolean(),
  }),

  'vote:request_bank_receive': z.object({
    amount: positiveAmount,
    reason: bankReceiveReason,
    customReason: z.string().max(50).optional(),
  }),

  'game_end_vote:cast': z.object({
    voteId: uuid,
    approve: z.boolean(),
  }),

  'game_end_vote:cancel': z.object({
    voteId: uuid,
  }),

  'asset:rename': z.object({
    assetId: uuid,
    newName: z.string().trim().min(1, '자산명을 입력해주세요').max(MAX_ASSET_NAME_LENGTH, `자산명은 ${MAX_ASSET_NAME_LENGTH}자 이하여야 합니다`),
  }),

  'tx:request_cancel': z.object({
    transactionId: uuid,
  }),

  'tx:respond_cancel': z.object({
    requestId: uuid,
    approve: z.boolean(),
  }),

  'player:kick': z.object({
    playerId: uuid,
  }),

  'notification:mark_read': z.object({
    notificationId: uuid,
  }),
};

/** 소켓 이벤트 payload 검증. 실패 시 ZodError throw */
export function validate<T>(eventName: string, data: unknown): T {
  const schema = schemas[eventName];
  if (!schema) {
    throw new Error(`Unknown event: ${eventName}`);
  }
  return schema.parse(data) as T;
}
