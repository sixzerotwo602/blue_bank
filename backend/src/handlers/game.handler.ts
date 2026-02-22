import type { Server, Socket } from 'socket.io';
import type { GameUseCases } from '../application/game.use-cases.js';
import type { VotingUseCases } from '../application/voting.use-cases.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import { VOTE_TIMEOUT_MS, ROOM_CLEANUP_DELAY_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';
import { isRoomMember, isRoomHost } from '../utils/helpers.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';

export const registerGameHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  gameUC: GameUseCases,
  votingUC: VotingUseCases
) => {
  socket.on('game:start', (initialCash: number) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'GENERAL')) {
        socket.emit('error', '요청이 너무 많습니다');
        return;
      }

      const v = validate<{ initialCash: number }>('game:start', { initialCash });

      const targetRoomId = gameUC.getRoomId(socket.id);
      if (!targetRoomId) return;

      const room = gameUC.getRoom(targetRoomId);
      if (!room) return;

      if (!isRoomHost(socket.id, room)) return;
      if (room.status !== 'LOBBY') return;

      room.status = 'PLAYING';

      if (v.initialCash && v.initialCash > 0) {
        room.players.forEach(p => {
          p.cash = v.initialCash;
        });
      }

      io.to(targetRoomId).emit('game:started');
      io.to(targetRoomId).emit('room:sync', room);
    } catch (e: any) {
      socket.emit('error', e.message || 'Error');
    }
  });

  socket.on('game:end', (_roomId: string) => {
    try {
      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) return;

      const room = gameUC.getRoom(roomId);
      if (!room) return;
      if (!isRoomHost(socket.id, room)) return;

      room.status = 'ENDED';

      const rankings = gameUC.calculateRankings(room.players);

      io.to(roomId).emit('game:ended', { rankings });
      io.to(roomId).emit('room:sync', room);

      timerManager.set(`${roomId}:cleanup`, () => {
        gameUC.cleanupRoom(roomId);
      }, ROOM_CLEANUP_DELAY_MS);
    } catch (e: any) {
      socket.emit('error', e.message || 'Error');
    }
  });

  socket.on('game:request_end', (_roomId: string, callback: (res: { success: boolean; error?: string; voteId?: string }) => void) => {
    try {
      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) {
        callback({ success: false, error: '방을 찾을 수 없습니다' });
        return;
      }

      const room = gameUC.getRoom(roomId);
      if (!room) {
        callback({ success: false, error: '방을 찾을 수 없습니다' });
        return;
      }
      if (!isRoomHost(socket.id, room)) {
        callback({ success: false, error: '호스트만 게임 종료를 요청할 수 있습니다' });
        return;
      }

      const vote = votingUC.startGameEndVote(room, socket.id);

      io.to(roomId).emit('game_end_vote:started', vote);

      timerManager.set(`${roomId}:vote:${vote.id}`, () => {
        const updatedRoom = gameUC.getRoom(roomId);
        if (!updatedRoom) return;

        const updatedVote = votingUC.handleGameEndVoteTimeout(vote.id, updatedRoom);
        if (updatedVote) {
          if (updatedVote.status === 'APPROVED') {
            updatedRoom.status = 'ENDED';
            const rankings = gameUC.calculateRankings(updatedRoom.players);

            io.to(roomId).emit('game_end_vote:ended', updatedVote);
            io.to(roomId).emit('game:ended', { rankings });
            io.to(roomId).emit('room:sync', updatedRoom);

            timerManager.set(`${roomId}:cleanup`, () => {
              gameUC.cleanupRoom(roomId);
            }, ROOM_CLEANUP_DELAY_MS);
          } else {
            io.to(roomId).emit('game_end_vote:ended', updatedVote);
          }
        }
      }, VOTE_TIMEOUT_MS);

      callback({ success: true, voteId: vote.id });
    } catch (error: any) {
      callback({ success: false, error: error.message || '투표 시작 실패' });
    }
  });

  socket.on('game_end_vote:cast', (voteId: string, approve: boolean, callback: (res: { success: boolean; error?: string }) => void) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ voteId: string; approve: boolean }>('game_end_vote:cast', { voteId, approve });

      const roomId = gameUC.getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방에 참여하지 않았습니다' });
      }
      const room = gameUC.getRoom(roomId);
      if (!room || !isRoomMember(socket.id, room)) {
        return callback({ success: false, error: '방 멤버가 아닙니다' });
      }

      const vote = votingUC.castGameEndVote(v.voteId, socket.id, v.approve, room);

      io.to(vote.roomId).emit('game_end_vote:updated', vote);

      if (vote.status === 'APPROVED') {
        timerManager.clear(`${vote.roomId}:vote:${v.voteId}`);

        const voteRoom = gameUC.getRoom(vote.roomId);
        if (voteRoom) {
          voteRoom.status = 'ENDED';
          const rankings = gameUC.calculateRankings(voteRoom.players);

          io.to(vote.roomId).emit('game_end_vote:ended', vote);
          io.to(vote.roomId).emit('game:ended', { rankings });
          io.to(vote.roomId).emit('room:sync', voteRoom);

          timerManager.set(`${vote.roomId}:cleanup`, () => {
            gameUC.cleanupRoom(vote.roomId);
          }, ROOM_CLEANUP_DELAY_MS);
        }
      } else if (vote.status === 'REJECTED') {
        timerManager.clear(`${vote.roomId}:vote:${v.voteId}`);
        io.to(vote.roomId).emit('game_end_vote:ended', vote);
      }

      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, error: error.message || '투표 실패' });
    }
  });

  socket.on('game_end_vote:cancel', (voteId: string, callback: (res: { success: boolean; error?: string }) => void) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'GENERAL')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ voteId: string }>('game_end_vote:cancel', { voteId });

      const vote = votingUC.cancelGameEndVote(v.voteId, socket.id);

      timerManager.clear(`${vote.roomId}:vote:${v.voteId}`);

      const room = gameUC.getRoom(vote.roomId);
      if (room) {
        io.to(vote.roomId).emit('game_end_vote:cancelled', {
          voteId: vote.id,
          cancelledBy: socket.id
        });
        io.to(vote.roomId).emit('game_end_vote:ended', vote);
      }

      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, error: error.message || '투표 취소 실패' });
    }
  });
};
