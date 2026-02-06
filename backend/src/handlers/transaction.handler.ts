import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, TransactionType, NotificationType } from '@blue-banker/shared';
import { transactionService } from '../services/transaction.service.js';
import { notificationService } from '../services/notification.service.js';
import { store } from '../models/store.js';
import { getRoomId, formatManwon } from '../utils/helpers.js';
import { CANCEL_REQUEST_TIMEOUT_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';

export const registerTransactionHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {

  // Task 4.2: bundleSell 옵션 추가
  socket.on('tx:request', (payload: { type: TransactionType; amount: number; toId?: string; assetType?: 'LAND' | 'BUILDING'; buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA'; reason?: string; bundleSell?: boolean }, callback?: (response: { success: boolean; txId?: string; error?: string }) => void) => {
    try {
        const roomId = getRoomId(socket.id);
        if (!roomId) {
            throw new Error('방을 찾을 수 없습니다');
        }

        const room = store.rooms.get(roomId);
        if (!room) {
            throw new Error('방을 찾을 수 없습니다');
        }

        const requester = room.players.find(p => p.id === socket.id);
        const requesterName = requester?.nickname || '알 수 없음';

        const transaction = transactionService.processTransaction(roomId, socket.id, payload);

        // Broadcast success
        io.to(roomId).emit('tx:processed', transaction);

        // Sync room state
        io.to(roomId).emit('room:sync', room);

        // 거래 타입별 알림 발송
        switch (payload.type) {
            case 'TRANSFER': {
                // 수금자에게 알림 발송
                if (payload.toId && payload.toId !== socket.id) {
                    const notification = notificationService.createNotification(
                        'TRANSFER_RECEIVED',
                        `${requesterName}님이 ${formatManwon(transaction.amount)}을 보냈습니다`,
                        payload.toId,
                        {
                            transactionId: transaction.id,
                            fromPlayerName: requesterName,
                            amount: transaction.amount
                        }
                    );
                    io.to(payload.toId).emit('notification:received', notification);
                }
                break;
            }

            case 'BANK_RECEIVE': {
                // 수령자에게 알림 발송 (본인 수령이므로 요청자에게)
                const reasonLabels: Record<string, string> = {
                    LOTTERY: '복권 당첨금',
                    PRIZE: '우승 상금',
                    BONUS: '보너스',
                    OTHER: '기타'
                };
                const reasonLabel = reasonLabels[payload.reason || ''] || '은행 지급';
                const notification = notificationService.createNotification(
                    'BANK_RECEIVED',
                    `${reasonLabel} ${formatManwon(transaction.amount)}을 수령했습니다`,
                    socket.id,
                    {
                        transactionId: transaction.id,
                        amount: transaction.amount
                    }
                );
                io.to(socket.id).emit('notification:received', notification);
                break;
            }

            case 'SELL_ASSET': {
                // 자산 매각 성공 알림 (요청자에게)
                const notification = notificationService.createNotification(
                    'BANK_RECEIVED',
                    `자산 매각으로 ${formatManwon(transaction.amount)}을 받았습니다`,
                    socket.id,
                    {
                        transactionId: transaction.id,
                        amount: transaction.amount
                    }
                );
                io.to(socket.id).emit('notification:received', notification);
                break;
            }

            case 'BUY_ASSET': {
                // 자산 매입 성공 알림 (요청자에게)
                const assetTypeLabel = payload.assetType === 'LAND' ? '토지' :
                    (payload.buildingType === 'HOTEL' ? '호텔' :
                     payload.buildingType === 'VILLA' ? '별장' : '빌딩');
                const notification = notificationService.createNotification(
                    'BANK_RECEIVED',
                    `${assetTypeLabel} ${formatManwon(transaction.amount)} 매입 완료`,
                    socket.id,
                    {
                        transactionId: transaction.id,
                        amount: transaction.amount
                    }
                );
                io.to(socket.id).emit('notification:received', notification);
                break;
            }

            case 'DONATE': {
                // 복지기금 기부 완료 알림
                const notification = notificationService.createNotification(
                    'BANK_RECEIVED',
                    `복지기금에 ${formatManwon(transaction.amount)} 기부 완료`,
                    socket.id,
                    {
                        transactionId: transaction.id,
                        amount: transaction.amount
                    }
                );
                io.to(socket.id).emit('notification:received', notification);
                break;
            }

            case 'PAY_COST': {
                // 은행 납부 완료 알림
                const notification = notificationService.createNotification(
                    'BANK_RECEIVED',
                    `은행에 ${formatManwon(transaction.amount)} 납부 완료`,
                    socket.id,
                    {
                        transactionId: transaction.id,
                        amount: transaction.amount
                    }
                );
                io.to(socket.id).emit('notification:received', notification);
                break;
            }
        }

        // Ack
        if (callback) callback({ success: true, txId: transaction.id });

    } catch (error: any) {
        // Ack error if callback provided, else emit global error
        if (callback) {
            callback({ success: false, error: error.message });
        } else {
            socket.emit('error', error.message || 'Transaction failed');
        }
    }
  });

  // T022: 거래 내역 조회 핸들러
  socket.on('transaction:get_history', (callback) => {
    try {
      const transactions = store.getPlayerTransactions(socket.id);
      callback(transactions);
    } catch (error: any) {
      // 에러 시 빈 배열 반환
      callback([]);
    }
  });

  // Task 6.2: 거래 취소 요청 핸들러
  socket.on('tx:request_cancel', (transactionId: string, callback) => {
    try {
      const roomId = getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const result = transactionService.requestCancelTransaction(roomId, transactionId, socket.id);

      if ('error' in result) {
        return callback({ success: false, error: result.error });
      }

      // 플레이어 간 거래인 경우 상대방에게 알림
      if (result.targetId !== 'BANK' && result.targetId !== 'FUND') {
        io.to(result.targetId).emit('tx:cancel_requested', result);

        // 거래 취소 요청 타임아웃 (TimerManager)
        timerManager.set(`${roomId}:cancel:${result.id}`, () => {
          const request = store.cancelRequests.get(result.id);
          if (request && request.status === 'PENDING') {
            request.status = 'EXPIRED';
            io.to(result.requesterId).emit('tx:cancel_responded', request);
          }
        }, CANCEL_REQUEST_TIMEOUT_MS);
      } else {
        // 은행/복지기금 거래는 즉시 취소 완료
        const transaction = transactionService.getTransaction(transactionId);
        if (transaction) {
          io.to(roomId).emit('tx:cancelled', transaction);
        }
        const room = store.rooms.get(roomId);
        if (room) {
          io.to(roomId).emit('room:sync', room);
        }
      }

      callback({ success: true, requestId: result.id });

    } catch (error: any) {
      callback({ success: false, error: error.message || '거래 취소 요청 실패' });
    }
  });

  // Task 6.2: 거래 취소 응답 핸들러
  socket.on('tx:respond_cancel', (requestId: string, approve: boolean, callback) => {
    try {
      const roomId = getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const result = transactionService.respondCancelRequest(roomId, requestId, socket.id, approve);

      if ('error' in result) {
        return callback({ success: false, error: result.error });
      }

      // 요청자에게 결과 알림
      io.to(result.requesterId).emit('tx:cancel_responded', result);

      // 승인된 경우 방 전체에 알림 및 동기화
      if (result.status === 'APPROVED') {
        const transaction = transactionService.getTransaction(result.transactionId);
        if (transaction) {
          io.to(roomId).emit('tx:cancelled', transaction);
        }
        const room = store.rooms.get(roomId);
        if (room) {
          io.to(roomId).emit('room:sync', room);
        }
      }

      callback({ success: true });

    } catch (error: any) {
      callback({ success: false, error: error.message || '거래 취소 응답 실패' });
    }
  });
};

