import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, BankReceiveReason } from '@blue-banker/shared';
import { voteService } from '../services/vote.service.js';
import { store } from '../models/store.js';

export const registerVoteHandlers = (
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

  socket.on('vote:request_fund', (_amount: number) => {
    try {
        const roomId = getRoomId();
        if (!roomId) throw new Error('방을 찾을 수 없습니다');

        // T015: Use full amount
        const room = store.rooms.get(roomId);
        if (!room) throw new Error('방을 찾을 수 없습니다');

        const fullAmount = room.welfareFund;
        if (fullAmount <= 0) throw new Error('복지기금이 없습니다.');

        const vote = voteService.createVote(roomId, socket.id, fullAmount);

        // FR-023: 60초 타임아웃 타이머 등록
        const timeoutId = setTimeout(() => {
            const result = voteService.processWelfareVoteTimeout(vote.id);
            if (result) {
                io.to(roomId).emit('vote:ended', result);
                const updatedRoom = store.rooms.get(roomId);
                if (updatedRoom) {
                    io.to(roomId).emit('room:sync', updatedRoom);
                }
            }
            store.voteTimeouts.delete(vote.id);
        }, 60000);
        store.voteTimeouts.set(vote.id, timeoutId);

        io.to(roomId).emit('vote:started', vote);
        io.to(roomId).emit('vote:updated', vote); // Initial state

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote request failed');
    }
  });

  socket.on('vote:cast', (voteId: string, approve: boolean) => {
    try {
        const vote = voteService.castVote(voteId, socket.id, approve);

        // Emit update - 투표 유형에 따라 적절한 이벤트 전송
        if (vote.voteType === 'BANK_RECEIVE') {
            io.to(vote.roomId).emit('bank_receive_vote:updated', vote);
        } else {
            io.to(vote.roomId).emit('vote:updated', vote);
        }

        // If ended, emit ended and room sync (since money changed)
        if (vote.status !== 'IN_PROGRESS') {
             // FR-023: 타이머 정리 (finalizeVote에서도 처리하지만 명시적으로)
             const timeoutId = store.voteTimeouts.get(vote.id);
             if (timeoutId) {
                 clearTimeout(timeoutId);
                 store.voteTimeouts.delete(vote.id);
             }

             // 투표 유형에 따라 적절한 이벤트 전송
             if (vote.voteType === 'BANK_RECEIVE') {
                 io.to(vote.roomId).emit('bank_receive_vote:ended', vote);
             } else {
                 io.to(vote.roomId).emit('vote:ended', vote);
             }

             const room = store.rooms.get(vote.roomId);
             if (room) {
                 io.to(vote.roomId).emit('room:sync', room);
             }
        }

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote cast failed');
    }
  });

  // Task 5.2: 은행 수령 투표 요청 핸들러
  socket.on('vote:request_bank_receive', (payload: { amount: number; reason: BankReceiveReason; customReason?: string }, callback) => {
    try {
        const roomId = getRoomId();
        if (!roomId) {
            return callback({ success: false, error: '방을 찾을 수 없습니다' });
        }

        const { amount, reason, customReason } = payload;

        // 금액 검증
        if (!amount || amount <= 0) {
            return callback({ success: false, error: '유효한 금액을 입력해주세요' });
        }

        // 진행 중인 투표 확인
        const existingVote = voteService.getActiveVote(roomId);
        if (existingVote) {
            return callback({ success: false, error: '이미 투표가 진행 중입니다' });
        }

        const vote = voteService.createBankReceiveVote(roomId, socket.id, amount, reason, customReason);

        // 60초 타임아웃 설정
        const timeoutId = setTimeout(() => {
            const result = voteService.processWelfareVoteTimeout(vote.id);
            if (result) {
                io.to(roomId).emit('bank_receive_vote:ended', result);
                const updatedRoom = store.rooms.get(roomId);
                if (updatedRoom) {
                    io.to(roomId).emit('room:sync', updatedRoom);
                }
            }
            store.voteTimeouts.delete(vote.id);
        }, 60000);
        store.voteTimeouts.set(vote.id, timeoutId);

        io.to(roomId).emit('bank_receive_vote:started', vote);
        callback({ success: true, voteId: vote.id });

    } catch (error: any) {
        callback({ success: false, error: error.message || '투표 요청 실패' });
    }
  });
};
