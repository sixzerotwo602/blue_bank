import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, TransactionType, NotificationType } from '@blue-banker/shared';
import { transactionService } from '../services/transaction.service.js';
import { notificationService } from '../services/notification.service.js';
import { store } from '../models/store.js';

// 금액을 만원 단위로 변환
function formatManwon(amount: number): string {
  if (amount === 0) return '0원';
  const manwon = amount / 10000;
  if (Number.isInteger(manwon)) {
    return `${manwon.toLocaleString()}만원`;
  } else {
    return `${manwon.toFixed(2).replace(/\.?0+$/, '')}만원`;
  }
}

export const registerTransactionHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {
  const getRoomId = () => {
     for (const room of store.rooms.values()) {
        if (room.players.some(p => p.id === socket.id)) {
            return room.id;
        }
     }
     return null;
  };

  socket.on('tx:request', (payload: { type: TransactionType; amount: number; toId?: string; assetType?: 'LAND' | 'BUILDING'; buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA'; reason?: string }, callback?: (response: { success: boolean; txId?: string; error?: string }) => void) => {
    try {
        const roomId = getRoomId();
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
};

