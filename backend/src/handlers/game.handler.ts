import { Server, Socket } from 'socket.io';
import { store } from '../models/store.js';
import { voteService } from '../services/vote.service.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

export const registerGameHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  socket.on('game:start', (initialCash: number) => {
    // Find room where this socket is host
    let targetRoomId: string | undefined;
    
    for (const room of store.rooms.values()) {
        if (room.hostId === socket.id) {
            targetRoomId = room.id;
            break;
        }
    }

    if (!targetRoomId) {
        return; 
    }

    const room = store.rooms.get(targetRoomId)!;
    
    if (room.status !== 'LOBBY') {
        return;
    }

    // Update status
    room.status = 'PLAYING';
    
    // Apply Initial Cash
    // If initialCash is valid (e.g. > 0), apply it. Otherwise keep default (0).
    if (initialCash && initialCash > 0) {
        room.players.forEach(p => {
            p.cash = initialCash;
        });
    }

    // Notify all
    io.to(targetRoomId).emit('game:started');
    io.to(targetRoomId).emit('room:sync', room);
  });

  socket.on('game:end', (roomId: string) => {
      const room = store.rooms.get(roomId);
      if (!room) return;
      if (room.hostId !== socket.id) return; // Host only

      room.status = 'ENDED';

      // Calculate Rankings (Cash + AssetValue)
      // We map to a new structure to include totalAssets and rank
      const rankings = room.players
          .map(p => ({
              id: p.id,
              nickname: p.nickname,
              cash: p.cash,
              assetValue: p.assetValue,
              totalAssets: p.cash + p.assetValue,
              rank: 0 
          }))
          .sort((a, b) => b.totalAssets - a.totalAssets);

      // Assign Rank
      rankings.forEach((r, index) => {
          r.rank = index + 1;
      });

      // Broadcast
      io.to(roomId).emit('game:ended', { rankings });
      io.to(roomId).emit('room:sync', room);
  });

  // T056: game:request_end 이벤트 핸들러 - 게임 종료 투표 시작
  socket.on('game:request_end', (roomId: string, callback: (res: { success: boolean; error?: string; voteId?: string }) => void) => {
      try {
          const room = store.rooms.get(roomId);
          if (!room) {
              callback({ success: false, error: '방을 찾을 수 없습니다' });
              return;
          }
          if (room.hostId !== socket.id) {
              callback({ success: false, error: '호스트만 게임 종료를 요청할 수 있습니다' });
              return;
          }

          const vote = voteService.createGameEndVote(roomId, socket.id);
          
          // T058: game_end_vote:started 이벤트 emit
          io.to(roomId).emit('game_end_vote:started', vote);
          
          // T054: 60초 후 타임아웃 처리
          setTimeout(() => {
              const updatedVote = voteService.processGameEndVoteTimeout(vote.id);
              if (updatedVote) {
                  if (updatedVote.status === 'APPROVED') {
                      // 게임 종료 처리
                      room.status = 'ENDED';
                      const rankings = room.players
                          .map(p => ({
                              id: p.id,
                              nickname: p.nickname,
                              cash: p.cash,
                              assetValue: p.assetValue,
                              totalAssets: p.cash + p.assetValue,
                              rank: 0
                          }))
                          .sort((a, b) => b.totalAssets - a.totalAssets);
                      rankings.forEach((r, index) => { r.rank = index + 1; });
                      
                      io.to(roomId).emit('game_end_vote:ended', updatedVote);
                      io.to(roomId).emit('game:ended', { rankings });
                      io.to(roomId).emit('room:sync', room);
                  } else {
                      io.to(roomId).emit('game_end_vote:ended', updatedVote);
                  }
              }
          }, 60000);

          callback({ success: true, voteId: vote.id });
      } catch (error: any) {
          callback({ success: false, error: error.message || '투표 시작 실패' });
      }
  });

  // T057: game_end_vote:cast 이벤트 핸들러 - 게임 종료 투표 처리
  socket.on('game_end_vote:cast', (voteId: string, approve: boolean, callback: (res: { success: boolean; error?: string }) => void) => {
      try {
          const vote = voteService.castGameEndVote(voteId, socket.id, approve);
          
          // T058: game_end_vote:updated 이벤트 emit
          const room = store.rooms.get(vote.roomId);
          if (room) {
              io.to(vote.roomId).emit('game_end_vote:updated', vote);
              
              // 투표 완료 확인
              if (vote.status === 'APPROVED') {
                  room.status = 'ENDED';
                  const rankings = room.players
                      .map(p => ({
                          id: p.id,
                          nickname: p.nickname,
                          cash: p.cash,
                          assetValue: p.assetValue,
                          totalAssets: p.cash + p.assetValue,
                          rank: 0
                      }))
                      .sort((a, b) => b.totalAssets - a.totalAssets);
                  rankings.forEach((r, index) => { r.rank = index + 1; });
                  
                  io.to(vote.roomId).emit('game_end_vote:ended', vote);
                  io.to(vote.roomId).emit('game:ended', { rankings });
                  io.to(vote.roomId).emit('room:sync', room);
              } else if (vote.status === 'REJECTED') {
                  io.to(vote.roomId).emit('game_end_vote:ended', vote);
              }
          }
          
          callback({ success: true });
      } catch (error: any) {
          callback({ success: false, error: error.message || '투표 실패' });
      }
  });
};

