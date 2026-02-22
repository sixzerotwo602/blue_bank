import type { Notification } from '@blue-banker/shared';
import type { INotificationRepository } from '../../domain/notification/notification.repository.js';
import type { MemoryStore } from './memory-store.js';

export class NotificationRepositoryImpl implements INotificationRepository {
  constructor(private readonly store: MemoryStore) {}

  save(notification: Notification): void {
    this.store.notifications.set(notification.id, notification);

    // playerNotifications 인덱스 갱신
    let notifSet = this.store.playerNotifications.get(notification.targetPlayerId);
    if (!notifSet) {
      notifSet = new Set();
      this.store.playerNotifications.set(notification.targetPlayerId, notifSet);
    }
    notifSet.add(notification.id);
  }

  findById(id: string): Notification | undefined {
    return this.store.notifications.get(id);
  }

  findByPlayerId(playerId: string): Notification[] {
    const notifIds = this.store.playerNotifications.get(playerId);
    if (!notifIds) return [];
    const result: Notification[] = [];
    for (const notifId of notifIds) {
      const notif = this.store.notifications.get(notifId);
      if (notif) result.push(notif);
    }
    return result;
  }

  countUnreadByPlayerId(playerId: string): number {
    const notifIds = this.store.playerNotifications.get(playerId);
    if (!notifIds) return 0;
    let count = 0;
    for (const notifId of notifIds) {
      const notif = this.store.notifications.get(notifId);
      if (notif && !notif.read) count++;
    }
    return count;
  }
}
