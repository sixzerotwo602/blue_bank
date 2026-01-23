import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, TransactionType } from '@blue-banker/shared';
import { transactionService } from '../services/transaction.service.js';
import { store } from '../models/store.js';

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

  socket.on('tx:request', (payload: { type: TransactionType; amount: number; toId?: string; assetType?: 'LAND' | 'BUILDING' }, callback?: (response: { success: boolean; txId?: string; error?: string }) => void) => {
    try {
        const roomId = getRoomId();
        if (!roomId) {
            throw new Error('Room not found');
        }

        const transaction = transactionService.processTransaction(roomId, socket.id, payload);

        // Broadcast success
        io.to(roomId).emit('tx:processed', transaction);

        // Sync room state
        const room = store.rooms.get(roomId);
        if (room) {
            io.to(roomId).emit('room:sync', room);
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
};
