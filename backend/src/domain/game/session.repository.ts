import type { DisconnectedSession } from '@blue-banker/shared';

export interface ISessionRepository {
  save(key: string, session: DisconnectedSession): void;
  findByKey(key: string): DisconnectedSession | undefined;
  delete(key: string): void;
  entries(): IterableIterator<[string, DisconnectedSession]>;
}
