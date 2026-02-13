import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, BankReceiveReason } from '@blue-banker/shared';
import { voteService } from '../services/vote.service.js';
import { store } from '../models/store.js';
import { getRoomId, isRoomMember } from '../utils/helpers.js';
import { VOTE_TIMEOUT_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';

export const registerVoteHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) => {

  socket.on('vote:request_fund', (_amount: number) => {
    try {
        if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
            socket.emit('error', '요청이 너무 많습니다');
            return;
        }

        const roomId = getRoomId(socket.id);
        if (!roomId) throw new Error('방을 찾을 수 없습니다');

        // T015: Use full amount
        const room = store.rooms.get(roomId);
        if (!room) throw new Error('방을 찾을 수 없습니다');

        if (!isRoomMember(socket.id, room)) throw new Error('방 멤버가 아닙니다');

        const fullAmount = room.welfareFund;
        if (fullAmount <= 0) throw new Error('복지기금이 없습니다.');

        const vote = voteService.createVote(roomId, socket.id, fullAmount);

        // FR-023: 투표 타임아웃 타이머 등록 (TimerManager)
        timerManager.set(`${roomId}:vote:${vote.id}`, () => {
            const result = voteService.processWelfareVoteTimeout(vote.id);
            if (result) {
                io.to(roomId).emit('vote:ended', result);
                const updatedRoom = store.rooms.get(roomId);
                if (updatedRoom) {
                    io.to(roomId).emit('room:sync', updatedRoom);
                }
            }
        }, VOTE_TIMEOUT_MS);

        io.to(roomId).emit('vote:started', vote);
        io.to(roomId).emit('vote:updated', vote); // Initial state

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote request failed');
    }
  });

  socket.on('vote:cast', (voteId: string, approve: boolean) => {
    try {
        if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
            socket.emit('error', '요청이 너무 많습니다');
            return;
        }

        const v = validate<{ voteId: string; approve: boolean }>('vote:cast', { voteId, approve });

        // 방 멤버십 검증 (핵심 취약점 수정)
        const roomId = getRoomId(socket.id);
        if (!roomId) {
            socket.emit('error', '방에 참여하지 않았습니다');
            return;
        }
        const room = store.rooms.get(roomId);
        if (!room || !isRoomMember(socket.id, room)) {
            socket.emit('error', '방 멤버가 아닙니다');
            return;
        }

        const vote = voteService.castVote(v.voteId, socket.id, v.approve);

        // Emit update - 투표 유형에 따라 적절한 이벤트 전송
        if (vote.voteType === 'BANK_RECEIVE') {
            io.to(vote.roomId).emit('bank_receive_vote:updated', vote);
        } else {
            io.to(vote.roomId).emit('vote:updated', vote);
        }

        // If ended, emit ended and room sync (since money changed)
        if (vote.status !== 'IN_PROGRESS') {
             // TimerManager로 타이머 정리
             timerManager.clear(`${vote.roomId}:vote:${vote.id}`);

             // 투표 유형에 따라 적절한 이벤트 전송
             if (vote.voteType === 'BANK_RECEIVE') {
                 io.to(vote.roomId).emit('bank_receive_vote:ended', vote);
             } else {
                 io.to(vote.roomId).emit('vote:ended', vote);
             }

             const voteRoom = store.rooms.get(vote.roomId);
             if (voteRoom) {
                 io.to(vote.roomId).emit('room:sync', voteRoom);
             }
        }

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote cast failed');
    }
  });

  // Task 5.2: 은행 수령 투표 요청 핸들러
  socket.on('vote:request_bank_receive', (payload: { amount: number; reason: BankReceiveReason; customReason?: string }, callback) => {
    try {
        if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
            return callback({ success: false, error: '요청이 너무 많습니다' });
        }

        const v = validate<{ amount: number; reason: BankReceiveReason; customReason?: string }>('vote:request_bank_receive', payload);

        const roomId = getRoomId(socket.id);
        if (!roomId) {
            return callback({ success: false, error: '방을 찾을 수 없습니다' });
        }

        const room = store.rooms.get(roomId);
        if (!room || !isRoomMember(socket.id, room)) {
            return callback({ success: false, error: '방 멤버가 아닙니다' });
        }

        // 진행 중인 투표 확인
        const existingVote = voteService.getActiveVote(roomId);
        if (existingVote) {
            return callback({ success: false, error: '이미 투표가 진행 중입니다' });
        }

        const vote = voteService.createBankReceiveVote(roomId, socket.id, v.amount, v.reason, v.customReason);

        // 투표 타임아웃 타이머 등록 (TimerManager)
        timerManager.set(`${roomId}:vote:${vote.id}`, () => {
            const result = voteService.processWelfareVoteTimeout(vote.id);
            if (result) {
                io.to(roomId).emit('bank_receive_vote:ended', result);
                const updatedRoom = store.rooms.get(roomId);
                if (updatedRoom) {
                    io.to(roomId).emit('room:sync', updatedRoom);
                }
            }
        }, VOTE_TIMEOUT_MS);

        io.to(roomId).emit('bank_receive_vote:started', vote);
        callback({ success: true, voteId: vote.id });

    } catch (error: any) {
        callback({ success: false, error: error.message || '투표 요청 실패' });
    }
  });
};
