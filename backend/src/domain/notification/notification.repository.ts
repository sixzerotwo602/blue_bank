import type { Notification } from '@blue-banker/shared';

export interface INotificationRepository {
  save(notification: Notification): void;
  findById(id: string): Notification | undefined;
  findByPlayerId(playerId: string): Notification[];
  countUnreadByPlayerId(playerId: string): number;
}
