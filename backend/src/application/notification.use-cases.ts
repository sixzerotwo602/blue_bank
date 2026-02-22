import type { Notification, NotificationType } from '@blue-banker/shared';
import type { INotificationRepository } from '../domain/notification/notification.repository.js';
import { createNotification, markAsRead } from '../domain/notification/notification.operations.js';

export class NotificationUseCases {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  create(
    type: NotificationType,
    message: string,
    targetPlayerId: string,
    relatedData?: {
      transactionId?: string;
      voteId?: string;
      fromPlayerName?: string;
      amount?: number;
    }
  ): Notification {
    const notification = createNotification(type, message, targetPlayerId, relatedData);
    this.notificationRepo.save(notification);
    return notification;
  }

  markOneAsRead(notificationId: string): boolean {
    const notification = this.notificationRepo.findById(notificationId);
    if (!notification) return false;

    const updated = markAsRead(notification);
    this.notificationRepo.save(updated);
    return true;
  }

  markAllAsRead(playerId: string): number {
    const notifications = this.notificationRepo.findByPlayerId(playerId);
    let count = 0;
    for (const notif of notifications) {
      if (!notif.read) {
        const updated = markAsRead(notif);
        this.notificationRepo.save(updated);
        count++;
      }
    }
    return count;
  }

  getPlayerNotifications(playerId: string): Notification[] {
    return this.notificationRepo.findByPlayerId(playerId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getUnreadCount(playerId: string): number {
    return this.notificationRepo.countUnreadByPlayerId(playerId);
  }
}
