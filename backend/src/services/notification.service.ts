import { store } from '../models/store.js';
import type { Notification, NotificationType } from '@blue-banker/shared';
import { randomUUID } from 'crypto';

class NotificationService {
  /**
   * T028: 새 알림 생성
   */
  createNotification(
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
    const notification: Notification = {
      id: randomUUID(),
      type,
      message,
      targetPlayerId,
      read: false,
      timestamp: Date.now()
    };

    if (relatedData) {
      notification.relatedData = relatedData;
    }

    store.notifications.set(notification.id, notification);
    return notification;
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(notificationId: string): boolean {
    const notification = store.notifications.get(notificationId);
    if (!notification) return false;
    
    notification.read = true;
    store.notifications.set(notificationId, notification);
    return true;
  }

  /**
   * 모든 알림 읽음 처리
   */
  markAllAsRead(playerId: string): number {
    let count = 0;
    for (const [id, notification] of store.notifications) {
      if (notification.targetPlayerId === playerId && !notification.read) {
        notification.read = true;
        store.notifications.set(id, notification);
        count++;
      }
    }
    return count;
  }

  /**
   * 플레이어의 알림 목록 조회
   */
  getPlayerNotifications(playerId: string): Notification[] {
    const notifications: Notification[] = [];
    for (const notification of store.notifications.values()) {
      if (notification.targetPlayerId === playerId) {
        notifications.push(notification);
      }
    }
    // 최신순 정렬
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 읽지 않은 알림 수
   */
  getUnreadCount(playerId: string): number {
    return store.getUnreadNotificationCount(playerId);
  }
}

export const notificationService = new NotificationService();
