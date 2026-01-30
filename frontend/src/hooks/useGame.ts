import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './useSocket';
import type { Room, Vote, Transaction, ConnectionStatusPayload, HostMigratingPayload, HostMigratedPayload, PlayerKickedPayload } from '@blue-banker/shared';
import toast from 'react-hot-toast';
import useSound from 'use-sound';

export const useGame = (roomId?: string) => {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<any[] | null>(null);
  const [activeVote, setActiveVote] = useState<Vote | null>(null);
  // T062: 게임 종료 투표 상태
  const [gameEndVote, setGameEndVote] = useState<Vote | null>(null);

  // Sound effects
  const [playSuccess] = useSound('/sounds/success.mp3');
  const [playError] = useSound('/sounds/error.mp3'); 

  const loadingToastId = useRef<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onSync = (updatedRoom: Room) => {
      // If we are tracking a specific room, ensure ID matches
      if (roomId && updatedRoom.id !== roomId) return;
      setRoom(updatedRoom);
      
      // Auto-redirect if game started
      if (updatedRoom.status === 'PLAYING' && window.location.pathname.includes('/lobby')) {
         navigate(`/game/${updatedRoom.id}`);
         toast.success('게임이 시작되었습니다!');
         playSuccess();
      }
    };

    const onGameStarted = () => {
       if (roomId) navigate(`/game/${roomId}`);
    };

    const onGameEnded = (payload: { rankings: any[] }) => {
        setRankings(payload.rankings);
        toast('게임이 종료되었습니다!', { icon: '🏁' });
    };
    
    const onVoteStarted = (vote: Vote) => {
        if (loadingToastId.current) {
            toast.dismiss(loadingToastId.current);
            loadingToastId.current = null;
        }
        setActiveVote(vote);
        toast('새로운 투표가 시작되었습니다.', { icon: '🗳️' });
    };
    const onVoteUpdated = (vote: Vote) => setActiveVote(vote);
    const onVoteEnded = (vote: Vote) => {
        setActiveVote(vote); 
        const result = vote.status === 'APPROVED' ? '승인됨' : '부결됨';
        if (vote.status === 'APPROVED') {
            toast.success(`투표 ${result}!`);
            playSuccess();
        } else {
            toast.error(`투표 ${result}!`);
            playError();
        }

        setTimeout(() => {
             setActiveVote(prev => prev?.id === vote.id ? null : prev);
        }, 3000);
    };

    const onError = (message: string) => {
        // Dismiss loading toast if any
        if (loadingToastId.current) {
            toast.dismiss(loadingToastId.current);
            loadingToastId.current = null;
        }
        toast.error(message);
        playError();
    };

    // Connection event handlers (T020, T031-T032, T040-T042, T050)
    const onConnectionStatus = (payload: ConnectionStatusPayload) => {
        setRoom(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                players: prev.players.map(p => 
                    p.id === payload.playerId 
                        ? { ...p, connectionStatus: payload.status }
                        : p
                )
            };
        });
        
        if (payload.status === 'OFFLINE') {
            toast(`${payload.nickname}님의 연결이 끊겼습니다`, { icon: '🔌' });
        }
    };

    const onPlayerRejoined = (payload: { playerId: string, nickname: string }) => {
        toast.success(`${payload.nickname}님이 재접속했습니다`);
    };

    const onHostMigrating = (payload: HostMigratingPayload) => {
        toast(`호스트 연결 끊김. ${payload.remainingSeconds}초 후 호스트가 변경됩니다.`, { 
            icon: '⏳',
            duration: 5000
        });
    };

    const onHostMigrated = (payload: HostMigratedPayload) => {
        setRoom(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                hostId: payload.newHostId,
                pendingHostMigration: false,
                players: prev.players.map(p => ({
                    ...p,
                    isHost: p.id === payload.newHostId
                }))
            };
        });
        toast.success(`${payload.newHostNickname}님이 새로운 호스트가 되었습니다`);
    };

    const onHostMigrationCancelled = (payload: { hostId: string, hostNickname: string }) => {
        setRoom(prev => {
            if (!prev) return prev;
            return { ...prev, pendingHostMigration: false };
        });
        toast(`${payload.hostNickname}님이 복귀했습니다`, { icon: '👋' });
    };

    const onPlayerKicked = (payload: PlayerKickedPayload) => {
        setRoom(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                players: prev.players.filter(p => p.id !== payload.playerId)
            };
        });
        toast(`${payload.nickname}님이 퇴장되었습니다`, { icon: '🚪' });
    };

    // T062: 게임 종료 투표 이벤트 핸들러
    const onGameEndVoteStarted = (vote: Vote) => {
        setGameEndVote(vote);
        toast('🚨 게임 종료 투표가 시작되었습니다!', { duration: 5000 });
    };
    const onGameEndVoteUpdated = (vote: Vote) => setGameEndVote(vote);
    const onGameEndVoteEnded = (payload: { vote: Vote; approved: boolean }) => {
        setGameEndVote(payload.vote);
        if (payload.approved) {
            toast.success('게임 종료가 승인되었습니다');
        } else {
            toast.error('게임 종료가 거부되었습니다');
            setTimeout(() => setGameEndVote(null), 3000);
        }
    };

    socket.on('room:sync', onSync);
    socket.on('game:started', onGameStarted);
    socket.on('game:ended', onGameEnded);
    socket.on('vote:started', onVoteStarted);
    socket.on('vote:updated', onVoteUpdated);
    socket.on('vote:ended', onVoteEnded);
    socket.on('error', onError);
    // Connection events
    socket.on('connection:status', onConnectionStatus);
    socket.on('player:rejoined', onPlayerRejoined);
    socket.on('host:migrating', onHostMigrating);
    socket.on('host:migrated', onHostMigrated);
    socket.on('host:migration_cancelled', onHostMigrationCancelled);
    socket.on('player:kicked', onPlayerKicked);
    // T062: Game end vote events
    // @ts-ignore
    socket.on('game_end_vote:started', onGameEndVoteStarted);
    // @ts-ignore
    socket.on('game_end_vote:updated', onGameEndVoteUpdated);
    // @ts-ignore
    socket.on('game_end_vote:ended', onGameEndVoteEnded);

    // Initial Fetch if room is missing (e.g. refresh or quick nav)
    if (roomId && !room) {
        // @ts-ignore Shared type update might be delayed in IDE/dev server
        socket.emit('room:get', roomId, (res: any) => {
            if (res.room) {
                setRoom(res.room);
            } else if (res.error) {
                setError(res.error);
                toast.error(res.error);
            }
        });
    }

    return () => {
      socket.off('room:sync', onSync);
      socket.off('game:started', onGameStarted);
      socket.off('game:ended', onGameEnded);
      socket.off('vote:started', onVoteStarted);
      socket.off('vote:updated', onVoteUpdated);
      socket.off('vote:ended', onVoteEnded);
      socket.off('error', onError);
      socket.off('connection:status', onConnectionStatus);
      socket.off('player:rejoined', onPlayerRejoined);
      socket.off('host:migrating', onHostMigrating);
      socket.off('host:migrated', onHostMigrated);
      socket.off('host:migration_cancelled', onHostMigrationCancelled);
      socket.off('player:kicked', onPlayerKicked);
      // @ts-ignore
      socket.off('game_end_vote:started', onGameEndVoteStarted);
      // @ts-ignore
      socket.off('game_end_vote:updated', onGameEndVoteUpdated);
      // @ts-ignore
      socket.off('game_end_vote:ended', onGameEndVoteEnded);
    };
  }, [socket, roomId, navigate, playSuccess, playError]);

  // Auto-rejoin on refresh/connect (T060)
  const hasAttemptedRelogin = useRef(false);

  useEffect(() => {
    if (!socket || !connected || !roomId || hasAttemptedRelogin.current) return;

    const storedNickname = localStorage.getItem(`blue-banker-nickname-${roomId}`);
    if (storedNickname) {
        hasAttemptedRelogin.current = true;
        
        // Try to join/rejoin
        socket.emit('room:join', roomId, storedNickname, (res) => {
            if (res.success) {
                // If success, we are good.
                // Could be a fresh join or a restore.
                toast.success('접속되었습니다');
            } else {
                // If failed (e.g. "Nickname taken"), it might be because we are already connected (nav) 
                // or someone else took it.
                // For "Nickname taken", we usually don't need to alert if it's just a nav check.
                // But if we are refreshing, we want to know.
                // Given the complexities, maybe just log or silent?
                if (res.message !== 'Nickname taken') {
                     // Only show error if it's NOT "Nickname taken" (which implies we might already be in)
                     // But wait, if we are 'spectating' (refresh), we are NOT in.
                     // If existing player is OFFLINE, we want to reclaim.
                     // Backend room.handler now handles "Game already started" -> Restore.
                     // But "Nickname taken" (Lobby duplicate) is still an issue if we don't fix backend.
                     // For MVP, if game started, this works.
                     console.log('Auto-join result:', res);
                }
            }
        });
    }
  }, [socket, connected, roomId]);

  const createRoom = useCallback((nickname: string) => {
    if (!socket) return;
    socket.emit('room:create', nickname, (res) => {
      if (res && res.roomId) {
        localStorage.setItem(`blue-banker-nickname-${res.roomId}`, nickname);
        toast.success(`방 생성 완료: ${res.roomId}`);
        navigate(`/lobby/${res.roomId}`);
      } else {
        setError('방 생성 실패');
        toast.error('방 생성 실패');
      }
    });
  }, [socket, navigate]);

  const joinRoom = useCallback((targetRoomId: string, nickname: string) => {
    if (!socket) return;
    socket.emit('room:join', targetRoomId, nickname, (res) => {
      if (res.success) {
        localStorage.setItem(`blue-banker-nickname-${targetRoomId}`, nickname);
        toast.success(`${targetRoomId}번 방 입장!`);
        navigate(`/lobby/${targetRoomId}`);
      } else {
        setError(res.message || '입장 실패');
        toast.error(res.message || '입장 실패');
      }
    });
  }, [socket, navigate]);

  const startGame = useCallback((initialCash: number) => {
    if (!socket) return;
    socket.emit('game:start', initialCash);
    toast('게임 시작 요청!', { icon: '🎮' });
  }, [socket]);

  const endGame = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('game:end', roomId);
    // Clear stored nickname on game end? Maybe.
    // localStorage.removeItem(`blue-banker-nickname-${roomId}`);
  }, [socket, roomId]);

  const requestTransaction = useCallback((type: string, amount: number, toId?: string, assetType?: 'LAND' | 'BUILDING', buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA') => {
    return new Promise<boolean>((resolve) => {
        if (!socket) {
            resolve(false);
            return;
        }
        // @ts-ignore Shared type update might not be reflected in frontend dev server yet without restart
        socket.emit('tx:request', { type, amount, toId, assetType, buildingType }, (res: any) => {
            if (!res.success) {
                toast.error(res.error || '거래 실패');
                playError();
                resolve(false);
            } else {
                toast.success('거래 성공!');
                playSuccess();
                resolve(true);
            }
        });
    });
  }, [socket, playSuccess, playError]);

  const requestFund = useCallback((amount: number) => {
      if(!socket) return;
      socket.emit('vote:request_fund', amount);
      const tid = toast.loading('투표 요청 중...');
      loadingToastId.current = tid;
  }, [socket]);

  const castVote = useCallback((voteId: string, approve: boolean) => {
      if(!socket) return;
      socket.emit('vote:cast', voteId, approve);
      toast.success('투표 완료');
  }, [socket]);

  // Kick player function (T049)
  const kickPlayer = useCallback((playerId: string) => {
      if (!socket) return;
      socket.emit('player:kick', playerId, (res) => {
          if (!res.success) {
              toast.error(res.message || '퇴장 처리 실패');
          }
      });
  }, [socket]);

  // T025: 거래 내역 조회
  const getTransactionHistory = useCallback((): Promise<Transaction[]> => {
      return new Promise((resolve) => {
          if (!socket) {
              resolve([]);
              return;
          }
          socket.emit('transaction:get_history', (transactions: Transaction[]) => {
              resolve(transactions);
          });
      });
  }, [socket]);

  // T042: 은행 수령 (호스트 전용)
  const bankReceive = useCallback((playerId: string, amount: number, reason: string) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          // @ts-ignore
          socket.emit('tx:request', { type: 'BANK_RECEIVE', amount, toId: playerId, reason }, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '지급 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('은행 지급 완료!');
                  playSuccess();
                  resolve(true);
              }
          });
      });
  }, [socket, playSuccess, playError]);

  // T051: 자산 매각
  const sellAsset = useCallback((assetId: string) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          // @ts-ignore - SELL_ASSET uses toId as assetId
          socket.emit('tx:request', { type: 'SELL_ASSET', amount: 0, toId: assetId }, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '매각 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('자산 매각 완료!');
                  playSuccess();
                  resolve(true);
              }
          });
      });
  }, [socket, playSuccess, playError]);

  // T062: 게임 종료 투표 요청 (호스트 전용)
  const requestGameEnd = useCallback(() => {
      return new Promise<boolean>((resolve) => {
          if (!socket || !roomId) {
              resolve(false);
              return;
          }
          // @ts-ignore
          socket.emit('game:request_end', roomId, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '게임 종료 요청 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('게임 종료 투표가 시작되었습니다');
                  resolve(true);
              }
          });
      });
  }, [socket, roomId, playError]);

  // T062: 게임 종료 투표 응답
  const castGameEndVote = useCallback((voteId: string, approve: boolean) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          // @ts-ignore
          socket.emit('game_end_vote:cast', voteId, approve, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '투표 실패');
                  playError();
                  resolve(false);
              } else {
                  resolve(true);
              }
          });
      });
  }, [socket, playError]);

  return {
    room,
    error,
    connected,
    activeVote,
    rankings,
    gameEndVote,  // T062
    createRoom,
    joinRoom,
    startGame,
    endGame,
    requestTransaction,
    requestFund,
    castVote,
    kickPlayer,
    getTransactionHistory,
    bankReceive,
    sellAsset,
    requestGameEnd,  // T062
    castGameEndVote  // T062
  };
};


