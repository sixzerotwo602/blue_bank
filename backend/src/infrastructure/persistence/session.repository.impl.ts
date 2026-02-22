import type { DisconnectedSession } from '@blue-banker/shared';
import type { ISessionRepository } from '../../domain/game/session.repository.js';
import type { MemoryStore } from './memory-store.js';

export class SessionRepositoryImpl implements ISessionRepository {
  constructor(private readonly store: MemoryStore) {}

  save(key: string, session: DisconnectedSession): void {
    this.store.disconnectedSessions.set(key, session);
  }

  findByKey(key: string): DisconnectedSession | undefined {
    return this.store.disconnectedSessions.get(key);
  }

  delete(key: string): void {
    this.store.disconnectedSessions.delete(key);
  }

  entries(): IterableIterator<[string, DisconnectedSession]> {
    return this.store.disconnectedSessions.entries();
  }
}
