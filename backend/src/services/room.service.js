import { store } from '../models/store.js';
export class RoomService {
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        do {
            result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (store.rooms.has(result));
        return result;
    }
    createRoom(hostId, nickname) {
        const roomId = this.generateRoomId();
        const host = {
            id: hostId,
            nickname,
            cash: 0, // Initial cash? Configurable? Rules say 0 or start amount
            assetValue: 0,
            roomId,
            isReady: false,
            isHost: true,
            connected: true,
        };
        const room = {
            id: roomId,
            status: 'LOBBY',
            players: [host],
            welfareFund: 0,
            hostId,
            createdAt: Date.now(),
        };
        store.rooms.set(roomId, room);
        return room;
    }
    joinRoom(roomId, playerId, nickname) {
        const room = store.rooms.get(roomId);
        if (!room) {
            return { success: false, message: 'Room not found' };
        }
        if (room.status !== 'LOBBY') {
            // Allow reconnect?
            const existing = room.players.find(p => p.id === playerId);
            if (existing) {
                // allow reconnect logic later?
            }
            // If we use UUID for player ID persisted in client, we can reconnect.
            // For MVP, usually socket.id is player.id. So reconnect is hard without tokens.
            // "One-time session" logic.
            return { success: false, message: 'Game already started' };
        }
        // Check nickname dup
        if (room.players.some(p => p.nickname === nickname)) {
            // Allow if it's me?
            return { success: false, message: 'Nickname taken' };
        }
        const player = {
            id: playerId,
            nickname,
            cash: 0, // Rules?
            assetValue: 0,
            roomId,
            isReady: false,
            isHost: false,
            connected: true,
        };
        room.players.push(player);
        return { success: true };
    }
    getRoom(roomId) {
        return store.rooms.get(roomId);
    }
}
export const roomService = new RoomService();
//# sourceMappingURL=room.service.js.map