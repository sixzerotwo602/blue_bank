import { Server, Socket } from 'socket.io';
import { store } from '../models/store.js';
import { voteService } from '../services/vote.service.js';
import { roomService } from '../services/room.service.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
import { VOTE_TIMEOUT_MS, ROOM_CLEANUP_DELAY_MS } from '../utils/constants.js';
import { timerManager } from '../utils/timer-manager.js';
import { getRoomId, isRoomMember, isRoomHost } from '../utils/helpers.js';
import { validate } from '../utils/validation.js';
import { rateLimiter } from '../utils/rate-limiter.js';

export const registerGameHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  socket.on('game:start', (initialCash: number) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'GENERAL')) {
        socket.emit('error', '요청이 너무 많습니다');
        return;
      }

      const v = validate<{ initialCash: number }>('game:start', { initialCash });

      const targetRoomId = getRoomId(socket.id);
      if (!targetRoomId) return;

      const room = store.rooms.get(targetRoomId);
      if (!room) return;

      if (!isRoomHost(socket.id, room)) return;
      if (room.status !== 'LOBBY') return;

      // Update status
      room.status = 'PLAYING';

      // Apply Initial Cash
      if (v.initialCash && v.initialCash > 0) {
        room.players.forEach(p => {
          p.cash = v.initialCash;
        });
      }

      // Notify all
      io.to(targetRoomId).emit('game:started');
      io.to(targetRoomId).emit('room:sync', room);
    } catch (e: any) {
      socket.emit('error', e.message || 'Error');
    }
  });

  socket.on('game:end', (_roomId: string) => {
    try {
      // 클라이언트 제공 roomId 무시, 서버에서 조회
      const roomId = getRoomId(socket.id);
      if (!roomId) return;

      const room = store.rooms.get(roomId);
      if (!room) return;
      if (!isRoomHost(socket.id, room)) return;

      room.status = 'ENDED';

      // 랭킹 계산
      const rankings = roomService.calculateRankings(room.players);

      // Broadcast
      io.to(roomId).emit('game:ended', { rankings });
      io.to(roomId).emit('room:sync', room);

      // 게임 종료 후 방 정리 타이머 등록
      timerManager.set(`${roomId}:cleanup`, () => {
        store.cleanupRoom(roomId);
      }, ROOM_CLEANUP_DELAY_MS);
    } catch (e: any) {
      socket.emit('error', e.message || 'Error');
    }
  });

  // T056: game:request_end 이벤트 핸들러 - 게임 종료 투표 시작
  socket.on('game:request_end', (_roomId: string, callback: (res: { success: boolean; error?: string; voteId?: string }) => void) => {
    try {
      // 클라이언트 제공 roomId 무시, 서버에서 조회
      const roomId = getRoomId(socket.id);
      if (!roomId) {
        callback({ success: false, error: '방을 찾을 수 없습니다' });
        return;
      }

      const room = store.rooms.get(roomId);
      if (!room) {
        callback({ success: false, error: '방을 찾을 수 없습니다' });
        return;
      }
      if (!isRoomHost(socket.id, room)) {
        callback({ success: false, error: '호스트만 게임 종료를 요청할 수 있습니다' });
        return;
      }

      const vote = voteService.createGameEndVote(roomId, socket.id);

      // T058: game_end_vote:started 이벤트 emit
      io.to(roomId).emit('game_end_vote:started', vote);

      // T054: 투표 타임아웃 (TimerManager)
      timerManager.set(`${roomId}:vote:${vote.id}`, () => {
        const updatedVote = voteService.processGameEndVoteTimeout(vote.id);
        if (updatedVote) {
          if (updatedVote.status === 'APPROVED') {
            // 게임 종료 처리
            room.status = 'ENDED';
            const rankings = roomService.calculateRankings(room.players);

            io.to(roomId).emit('game_end_vote:ended', updatedVote);
            io.to(roomId).emit('game:ended', { rankings });
            io.to(roomId).emit('room:sync', room);

            // 게임 종료 후 방 정리 타이머 등록
            timerManager.set(`${roomId}:cleanup`, () => {
              store.cleanupRoom(roomId);
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

  // T057: game_end_vote:cast 이벤트 핸들러 - 게임 종료 투표 처리
  socket.on('game_end_vote:cast', (voteId: string, approve: boolean, callback: (res: { success: boolean; error?: string }) => void) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'VOTE')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ voteId: string; approve: boolean }>('game_end_vote:cast', { voteId, approve });

      // 방 멤버십 체크
      const roomId = getRoomId(socket.id);
      if (!roomId) {
        return callback({ success: false, error: '방에 참여하지 않았습니다' });
      }
      const room = store.rooms.get(roomId);
      if (!room || !isRoomMember(socket.id, room)) {
        return callback({ success: false, error: '방 멤버가 아닙니다' });
      }

      const vote = voteService.castGameEndVote(v.voteId, socket.id, v.approve);

      // T058: game_end_vote:updated 이벤트 emit
      const voteRoom = store.rooms.get(vote.roomId);
      if (voteRoom) {
        io.to(vote.roomId).emit('game_end_vote:updated', vote);

        // 투표 완료 확인
        if (vote.status === 'APPROVED') {
          // TimerManager로 타이머 정리
          timerManager.clear(`${vote.roomId}:vote:${v.voteId}`);

          voteRoom.status = 'ENDED';
          const rankings = roomService.calculateRankings(voteRoom.players);

          io.to(vote.roomId).emit('game_end_vote:ended', vote);
          io.to(vote.roomId).emit('game:ended', { rankings });
          io.to(vote.roomId).emit('room:sync', voteRoom);

          // 게임 종료 후 방 정리 타이머 등록
          timerManager.set(`${vote.roomId}:cleanup`, () => {
            store.cleanupRoom(vote.roomId);
          }, ROOM_CLEANUP_DELAY_MS);
        } else if (vote.status === 'REJECTED') {
          // TimerManager로 타이머 정리
          timerManager.clear(`${vote.roomId}:vote:${v.voteId}`);
          io.to(vote.roomId).emit('game_end_vote:ended', vote);
        }
      }

      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, error: error.message || '투표 실패' });
    }
  });

  // T047: game_end_vote:cancel 이벤트 핸들러 - 게임 종료 투표 취소
  socket.on('game_end_vote:cancel', (voteId: string, callback: (res: { success: boolean; error?: string }) => void) => {
    try {
      if (!rateLimiter.checkLimit(socket.id, 'GENERAL')) {
        return callback({ success: false, error: '요청이 너무 많습니다' });
      }

      const v = validate<{ voteId: string }>('game_end_vote:cancel', { voteId });

      const vote = voteService.cancelGameEndVote(v.voteId, socket.id);

      // TimerManager로 타이머 정리
      timerManager.clear(`${vote.roomId}:vote:${v.voteId}`);

      const room = store.rooms.get(vote.roomId);
      if (room) {
        // NEW: 취소 전용 이벤트 브로드캐스트 (클라이언트에서 모달 닫힘 + 토스트 표시)
        io.to(vote.roomId).emit('game_end_vote:cancelled', {
          voteId: vote.id,
          cancelledBy: socket.id
        });
        // 기존 ended 이벤트도 유지 (하위 호환성)
        io.to(vote.roomId).emit('game_end_vote:ended', vote);
      }

      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, error: error.message || '투표 취소 실패' });
    }
  });
};
