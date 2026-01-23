import { Server, Socket } from 'socket.io';
import { transactionService } from '../services/transaction.service.js';
import { store } from '../models/store.js';
export const registerTransactionHandlers = (io, socket) => {
    const getRoomId = () => {
        for (const room of store.rooms.values()) {
            if (room.players.some(p => p.id === socket.id)) {
                return room.id;
            }
        }
        return null;
    };
    socket.on('tx:request', (payload, callback) => {
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
            if (callback)
                callback({ success: true, txId: transaction.id });
        }
        catch (error) {
            // Ack error if callback provided, else emit global error
            if (callback) {
                callback({ success: false, error: error.message });
            }
            else {
                socket.emit('error', error.message || 'Transaction failed');
            }
        }
    });
};
//# sourceMappingURL=transaction.handler.js.map