import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, TransactionType } from '@blue-banker/shared';
import type { GameUseCases } from '../application/game.use-cases.js';
import type { TransactionUseCases } from '../application/transaction.use-cases.js';
import type { NotificationUseCases } from '../application/notification.use-cases.js';
import { formatManwon, isRoomMember } from '../utils/helpers.js';
import { CANCEL_REQUEST_TIMEOUT_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';


export const registerTransactionHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  gameUC: GameUseCases,
  transactionUC: TransactionUseCases,
  notificationUC: NotificationUseCases
) => {

  socket.on('tx:request', (payload: { type: TransactionType; amount: number; toId?: string; assetType?: 'LAND' | 'BUILDING'; buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA'; reason?: string; bundleSell?: boolean }, callback?: (response: { success: boolean; txId?: string; error?: string }) => void) => {
    try {
        if (!rateLimiter.checkLimit(socket.id, 'TRANSACTION')) {
            if (callback) return callback({ success: false, error: '요청이 너무 많습니다' });
            return;
        }

        const v = validate<typeof payload>('tx:request', payload);

        const roomId = gameUC.getRoomId(socket.id);
        if (!roomId) {
            throw new Error('방을 찾을 수 없습니다');
        }

        const room = gameUC.getRoom(roomId);
        if (!room) {
            throw new Error('방을 찾을 수 없습니다');
        }

        if (!isRoomMember(socket.id, room)) {
            throw new Error('방 멤버가 아닙니다');
        }

        const requester = room.players.find(p => p.id === socket.id);
        const requesterName = requester?.nickname || '알 수 없음';

        const transaction = transactionUC.process(room, socket.id, v);

        io.to(roomId).emit('tx:processed', transaction);
        io.to(roomId).emit('room:sync', room);

        switch (v.type) {
            case 'TRANSFER': {
                if (v.toId && v.toId !== socket.id) {
                    const notification = notificationUC.create(
                        'TRANSFER_RECEIVED',
                        `${requesterName}님이 ${formatManwon(transaction.amount)}을 보냈습니다`,
                        v.toId,
                        {
                            transactionId: transaction.id,
                            fromPlayerName: requesterName,
                            amount: transaction.amount
                        }
                    );
                    io.to(v.toId).emit('notification:received', notification);
                }
                break;
            }

            case 'BANK_RECEIVE': {
                const reasonLabels: Record<string, string> = {
                    LOTTERY: '복권 당첨금',
                    PRIZE: '우승 상금',
                    BONUS: '보너스',
                    OTHER: '기타'
                };
                const reasonLabel = reasonLabels[v.reason || ''] || '은행 지급';
                const notification = notificationUC.create(
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
                const notification = notificationUC.create(
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
                const assetTypeLabel = v.assetType === 'LAND' ? '토지' :
                    (v.buildingType === 'HOTEL' ? '호텔' :
                     v.buildingType === 'VILLA' ? '별장' : '빌딩');
                const notification = notificationUC.create(
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
                const notification = notificationUC.create(
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
                const notification = notificationUC.create(
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

        if (callback) callback({ success: true, txId: transaction.id });

    } catch (error: any) {
        if (callback) {
            callback({ success: false, error: error.message });
        } else {
            socket.emit('error', error.message || 'Transaction failed');
        }
    }
  });

  socket.on('transaction:get_history', (callback) => {
    try {
      const transactions = transactionUC.getPlayerTransactions(socket.id);
      callback(transactions);
    } catch (error: any) {
      callback([]);
    }
  });

  socket.on('tx:request_cancel', (transactionId: string, callback) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'TRANSACTION')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ transactionId: string }>('tx:request_cancel', { transactionId });

      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const room = gameUC.getRoom(roomId);
      if (!room) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const result = transactionUC.requestCancel(room, v.transactionId, socket.id);

      if ('error' in result) {
        return callback({ success: false, error: result.error });
      }

      if (result.targetId !== 'BANK' && result.targetId !== 'FUND') {
        io.to(result.targetId).emit('tx:cancel_requested', result);

        timerManager.set(`${roomId}:cancel:${result.id}`, () => {
          const expired = transactionUC.expireCancelRequest(result.id);
          if (expired) {
            io.to(result.requesterId).emit('tx:cancel_responded', expired);
          }
        }, CANCEL_REQUEST_TIMEOUT_MS);
      } else {
        const transaction = transactionUC.getTransaction(v.transactionId);
        if (transaction) {
          io.to(roomId).emit('tx:cancelled', transaction);
        }
        io.to(roomId).emit('room:sync', room);
      }

      callback({ success: true, requestId: result.id });

    } catch (error: any) {
      callback({ success: false, error: error.message || '거래 취소 요청 실패' });
    }
  });

  socket.on('tx:respond_cancel', (requestId: string, approve: boolean, callback) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'TRANSACTION')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ requestId: string; approve: boolean }>('tx:respond_cancel', { requestId, approve });

      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const room = gameUC.getRoom(roomId);
      if (!room) {
        return callback({ success: false, error: '방을 찾을 수 없습니다' });
      }

      const result = transactionUC.respondCancel(room, v.requestId, socket.id, v.approve);

      if ('error' in result) {
        return callback({ success: false, error: result.error });
      }

      io.to(result.requesterId).emit('tx:cancel_responded', result);

      if (result.status === 'APPROVED') {
        const transaction = transactionUC.getTransaction(result.transactionId);
        if (transaction) {
          io.to(roomId).emit('tx:cancelled', transaction);
        }
        io.to(roomId).emit('room:sync', room);
      }

      callback({ success: true });

    } catch (error: any) {
      callback({ success: false, error: error.message || '거래 취소 응답 실패' });
    }
  });
};
