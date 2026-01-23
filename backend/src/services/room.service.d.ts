import type { Room } from '@blue-banker/shared';
export declare class RoomService {
    private generateRoomId;
    createRoom(hostId: string, nickname: string): Room;
    joinRoom(roomId: string, playerId: string, nickname: string): {
        success: boolean;
        message?: string;
    };
    getRoom(roomId: string): Room | undefined;
}
export declare const roomService: RoomService;
//# sourceMappingURL=room.service.d.ts.map