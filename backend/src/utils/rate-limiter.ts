import { RATE_LIMITS } from './constants.js';

type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private records = new Map<string, RateLimitRecord>();

  /** Fixed-window rate limit 체크. 초과 시 false 반환 */
  checkLimit(identifier: string, limitType: RateLimitType): boolean {
    const limit = RATE_LIMITS[limitType];
    const key = `${limitType}:${identifier}`;
    const now = Date.now();

    const record = this.records.get(key);

    if (!record || now >= record.resetAt) {
      this.records.set(key, { count: 1, resetAt: now + limit.windowMs });
      return true;
    }

    record.count++;
    if (record.count > limit.maxRequests) {
      console.warn(`[RateLimit] ${limitType} exceeded for ${identifier}`);
      return false;
    }

    return true;
  }

  /** disconnect 시 해당 식별자의 모든 레코드 정리 */
  clear(identifier: string): void {
    for (const key of this.records.keys()) {
      if (key.endsWith(`:${identifier}`)) {
        this.records.delete(key);
      }
    }
  }

  /** 만료된 레코드 일괄 정리 */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetAt) {
        this.records.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();
