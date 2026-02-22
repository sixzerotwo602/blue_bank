import type { Notification, NotificationType } from '@blue-banker/shared';
import { randomUUID } from 'crypto';

/**
 * Notification 도메인 순수 함수
 */

export function createNotification(
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

  return notification;
}

export function markAsRead(notification: Notification): Notification {
  return { ...notification, read: true };
}
