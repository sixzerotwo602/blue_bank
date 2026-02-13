import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import { notificationService } from '../services/notification.service.js';
import { validate } from '../utils/validation.js';

/**
 * T029: 알림 핸들러 - mark_read, mark_all_read
 */
export const registerNotificationHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  // 단일 알림 읽음 처리
  socket.on('notification:mark_read', (notificationId: string, callback) => {
    try {
      const v = validate<{ notificationId: string }>('notification:mark_read', { notificationId });
      const success = notificationService.markAsRead(v.notificationId);
      if (callback) callback({ success });
    } catch (error) {
      if (callback) callback({ success: false });
    }
  });

  // 모든 알림 읽음 처리
  socket.on('notification:mark_all_read', (callback) => {
    try {
      const count = notificationService.markAllAsRead(socket.id);
      if (callback) callback({ success: true, count });
    } catch (error) {
      if (callback) callback({ success: false, count: 0 });
    }
  });

  // 알림 목록 조회
  socket.on('notification:get_list', (callback) => {
    try {
      const notifications = notificationService.getPlayerNotifications(socket.id);
      if (callback) callback(notifications);
    } catch (error) {
      if (callback) callback([]);
    }
  });

  // 읽지 않은 알림 수 조회
  socket.on('notification:get_unread_count', (callback) => {
    try {
      const count = notificationService.getUnreadCount(socket.id);
      if (callback) callback(count);
    } catch (error) {
      if (callback) callback(0);
    }
  });
};
