import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, BankReceiveReason } from '@blue-banker/shared';
import type { GameUseCases } from '../application/game.use-cases.js';
import type { VotingUseCases } from '../application/voting.use-cases.js';
import { isRoomMember } from '../utils/helpers.js';
import { VOTE_TIMEOUT_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';

export const registerVoteHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  gameUC: GameUseCases,
  votingUC: VotingUseCases
) => {

  socket.on('vote:request_fund', (_amount: number) => {
    try {
        if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
            socket.emit('error', '요청이 너무 많습니다');
            return;
        }

        const roomId = gameUC.getRoomId(socket.id);
        if (!roomId) throw new Error('방을 찾을 수 없습니다');

        const room = gameUC.getRoom(roomId);
        if (!room) throw new Error('방을 찾을 수 없습니다');

        if (!isRoomMember(socket.id, room)) throw new Error('방 멤버가 아닙니다');

        const vote = votingUC.startWelfareVote(room, socket.id);

        timerManager.set(`${roomId}:vote:${vote.id}`, () => {
            const updatedRoom = gameUC.getRoom(roomId);
            if (!updatedRoom) return;
            votingUC.handleVoteTimeout(vote, updatedRoom);
            io.to(roomId).emit('vote:ended', vote);
            io.to(roomId).emit('room:sync', updatedRoom);
        }, VOTE_TIMEOUT_MS);

        io.to(roomId).emit('vote:started', vote);
        io.to(roomId).emit('vote:updated', vote);

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

        const roomId = gameUC.getRoomId(socket.id);
        if (!roomId) {
            socket.emit('error', '방에 참여하지 않았습니다');
            return;
        }
        const room = gameUC.getRoom(roomId);
        if (!room || !isRoomMember(socket.id, room)) {
            socket.emit('error', '방 멤버가 아닙니다');
            return;
        }

        const vote = votingUC.castVote(v.voteId, socket.id, v.approve, room);

        if (vote.voteType === 'BANK_RECEIVE') {
            io.to(vote.roomId).emit('bank_receive_vote:updated', vote);
        } else {
            io.to(vote.roomId).emit('vote:updated', vote);
        }

        if (vote.status !== 'IN_PROGRESS') {
             if (vote.voteType === 'BANK_RECEIVE') {
                 io.to(vote.roomId).emit('bank_receive_vote:ended', vote);
             } else {
                 io.to(vote.roomId).emit('vote:ended', vote);
             }

             const voteRoom = gameUC.getRoom(vote.roomId);
             if (voteRoom) {
                 io.to(vote.roomId).emit('room:sync', voteRoom);
             }
        }

    } catch (error: any) {
        socket.emit('error', error.message || 'Vote cast failed');
    }
  });

  socket.on('vote:request_bank_receive', (payload: { amount: number; reason: BankReceiveReason; customReason?: string }, callback) => {
    try {
        if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
            return callback({ success: false, error: '요청이 너무 많습니다' });
        }

        const v = validate<{ amount: number; reason: BankReceiveReason; customReason?: string }>('vote:request_bank_receive', payload);

        const roomId = gameUC.getRoomId(socket.id);
        if (!roomId) {
            return callback({ success: false, error: '방을 찾을 수 없습니다' });
        }

        const room = gameUC.getRoom(roomId);
        if (!room || !isRoomMember(socket.id, room)) {
            return callback({ success: false, error: '방 멤버가 아닙니다' });
        }

        const vote = votingUC.startBankReceiveVote(room, socket.id, v.amount, v.reason, v.customReason);

        timerManager.set(`${roomId}:vote:${vote.id}`, () => {
            const updatedRoom = gameUC.getRoom(roomId);
            if (!updatedRoom) return;
            votingUC.handleVoteTimeout(vote, updatedRoom);
            io.to(roomId).emit('bank_receive_vote:ended', vote);
            io.to(roomId).emit('room:sync', updatedRoom);
        }, VOTE_TIMEOUT_MS);

        io.to(roomId).emit('bank_receive_vote:started', vote);
        callback({ success: true, voteId: vote.id });

    } catch (error: any) {
        callback({ success: false, error: error.message || '투표 요청 실패' });
    }
  });
};
