import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './useSocket';
import type { Room, Vote, Transaction, ConnectionStatusPayload, HostMigratingPayload, HostMigratedPayload, PlayerKickedPayload, Notification, BankReceiveReason, CancelRequest } from '@blue-banker/shared';
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
  // Task 5.4: 은행 수령 투표 상태
  const [bankReceiveVote, setBankReceiveVote] = useState<Vote | null>(null);
  // Task 6.4: 거래 취소 요청 상태
  const [cancelRequest, setCancelRequest] = useState<CancelRequest | null>(null);
  // 거래 업데이트 콜백 (실시간 갱신용)
  const transactionUpdateCallbackRef = useRef<(() => void) | null>(null);

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
            // 복지기금 투표 승인 시 거래 내역 갱신 (락 상태 업데이트)
            if (vote.voteType === 'WELFARE' && transactionUpdateCallbackRef.current) {
                transactionUpdateCallbackRef.current();
            }
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
    // NEW: 게임 종료 투표 취소 이벤트 핸들러 (FR-007, FR-008)
    const onGameEndVoteCancelled = (_payload: { voteId: string; cancelledBy: string }) => {
        setGameEndVote(null);
        toast.success('게임종료 투표가 취소되었습니다');
    };

    // Task 5.5: 은행 수령 투표 이벤트 핸들러
    const onBankReceiveVoteStarted = (vote: Vote) => {
        setBankReceiveVote(vote);
        const requester = room?.players.find(p => p.id === vote.requesterId);
        const requesterName = requester?.nickname || '플레이어';
        toast(`${requesterName}님이 은행 수령을 요청했습니다`, { icon: '🏦' });
    };

    const onBankReceiveVoteUpdated = (vote: Vote) => {
        setBankReceiveVote(vote);
    };

    const onBankReceiveVoteEnded = (vote: Vote) => {
        setBankReceiveVote(null);
        const requester = room?.players.find(p => p.id === vote.requesterId);
        const requesterName = requester?.nickname || '플레이어';
        if (vote.status === 'APPROVED') {
            toast.success(`${requesterName}님의 은행 수령이 승인되었습니다`);
            playSuccess();
        } else {
            toast.error(`${requesterName}님의 은행 수령이 거절되었습니다`);
        }
    };

    // Task 6.5: 거래 취소 이벤트 핸들러
    const onCancelRequested = (request: CancelRequest) => {
        setCancelRequest(request);
        toast('거래 취소 요청이 도착했습니다', { icon: '❌', duration: 10000 });
    };

    const onCancelResponded = (request: CancelRequest) => {
        setCancelRequest(null);
        if (request.status === 'APPROVED') {
            toast.success('거래 취소가 승인되었습니다');
            playSuccess();
            // 거래 내역 실시간 갱신 콜백 호출
            if (transactionUpdateCallbackRef.current) {
                transactionUpdateCallbackRef.current();
            }
        } else if (request.status === 'REJECTED') {
            toast.error('거래 취소가 거절되었습니다');
        } else {
            toast.error('거래 취소 요청이 만료되었습니다');
        }
    };

    const onTransactionCancelled = (_transaction: Transaction) => {
        toast(`거래가 취소되었습니다`, { icon: '↩️' });
        // 거래 내역 실시간 갱신 콜백 호출
        if (transactionUpdateCallbackRef.current) {
            transactionUpdateCallbackRef.current();
        }
    };

    // T017: notification:received 이벤트 핸들러 (송금 수신 등)
    const onNotificationReceived = (notification: Notification) => {
        switch (notification.type) {
            case 'TRANSFER_RECEIVED':
                toast.success(notification.message, { icon: '💸' });
                playSuccess();
                break;
            case 'BANK_RECEIVED':
                toast.success(notification.message, { icon: '🏦' });
                playSuccess();
                break;
            case 'VOTE_STARTED':
                toast(notification.message, { icon: '🗳️' });
                break;
            case 'VOTE_ENDED':
                toast(notification.message, { icon: '✅' });
                break;
            case 'GAME_END_REQUESTED':
                toast(notification.message, { icon: '🚨', duration: 5000 });
                break;
            case 'GAME_ENDED':
                toast(notification.message, { icon: '🏁' });
                break;
            default:
                toast(notification.message);
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
    // NEW: 게임 종료 투표 취소 이벤트 (FR-007, FR-008)
    // @ts-ignore
    socket.on('game_end_vote:cancelled', onGameEndVoteCancelled);
    // Task 5.5: 은행 수령 투표 이벤트
    // @ts-ignore
    socket.on('bank_receive_vote:started', onBankReceiveVoteStarted);
    // @ts-ignore
    socket.on('bank_receive_vote:updated', onBankReceiveVoteUpdated);
    // @ts-ignore
    socket.on('bank_receive_vote:ended', onBankReceiveVoteEnded);
    // Task 6.5: 거래 취소 이벤트
    // @ts-ignore
    socket.on('tx:cancel_requested', onCancelRequested);
    // @ts-ignore
    socket.on('tx:cancel_responded', onCancelResponded);
    // @ts-ignore
    socket.on('tx:cancelled', onTransactionCancelled);
    // T017: Notification events
    // @ts-ignore
    socket.on('notification:received', onNotificationReceived);

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
      // @ts-ignore
      socket.off('game_end_vote:cancelled', onGameEndVoteCancelled);
      // @ts-ignore
      socket.off('bank_receive_vote:started', onBankReceiveVoteStarted);
      // @ts-ignore
      socket.off('bank_receive_vote:updated', onBankReceiveVoteUpdated);
      // @ts-ignore
      socket.off('bank_receive_vote:ended', onBankReceiveVoteEnded);
      // @ts-ignore
      socket.off('tx:cancel_requested', onCancelRequested);
      // @ts-ignore
      socket.off('tx:cancel_responded', onCancelResponded);
      // @ts-ignore
      socket.off('tx:cancelled', onTransactionCancelled);
      // @ts-ignore
      socket.off('notification:received', onNotificationReceived);
    };
  }, [socket, roomId, navigate, playSuccess, playError, room]);

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

  // T028: 토지명/토지ID/별장갯수 추가
  const requestTransaction = useCallback((type: string, amount: number, toId?: string, assetType?: 'LAND' | 'BUILDING', buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA', landName?: string, selectedLandId?: string, villaCount?: number) => {
    return new Promise<boolean>((resolve) => {
        if (!socket) {
            resolve(false);
            return;
        }
        // @ts-ignore Shared type update might not be reflected in frontend dev server yet without restart
        socket.emit('tx:request', { type, amount, toId, assetType, buildingType, landName, selectedLandId, villaCount }, (res: any) => {
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

  // T042: 은행 수령 (호스트 전용 - 직접 지급)
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

  // Task 5.3: 은행 수령 투표 요청 (일반 플레이어용)
  const requestBankReceive = useCallback((amount: number, reason: BankReceiveReason, customReason?: string) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          socket.emit('vote:request_bank_receive', { amount, reason, customReason }, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '투표 요청 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('투표 요청이 전송되었습니다');
                  resolve(true);
              }
          });
      });
  }, [socket, playError]);

  // Task 6.5: 거래 취소 요청
  const requestCancelTransaction = useCallback((transactionId: string) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          socket.emit('tx:request_cancel', transactionId, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '거래 취소 요청 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('거래 취소 요청이 전송되었습니다');
                  resolve(true);
              }
          });
      });
  }, [socket, playError]);

  // Task 6.5: 거래 취소 응답
  const respondCancelTransaction = useCallback((requestId: string, approve: boolean) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          socket.emit('tx:respond_cancel', requestId, approve, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '응답 실패');
                  playError();
                  resolve(false);
              } else {
                  setCancelRequest(null);
                  resolve(true);
              }
          });
      });
  }, [socket, playError]);

  // T051: 자산 매각
  // Task 4.2: bundleSell 옵션 추가 (토지 매각 시 건물 일괄 처리)
  const sellAsset = useCallback((assetId: string, bundleSell?: boolean) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          // @ts-ignore - SELL_ASSET uses toId as assetId
          socket.emit('tx:request', { type: 'SELL_ASSET', amount: 0, toId: assetId, bundleSell }, (res: any) => {
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

  // Task 7.3: 자산명 수정
  const renameAsset = useCallback((assetId: string, newName: string) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          socket.emit('asset:rename', assetId, newName, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '자산명 변경 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('자산명이 변경되었습니다');
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

  // T049: 게임 종료 투표 취소
  const cancelGameEndVote = useCallback((voteId: string) => {
      return new Promise<boolean>((resolve) => {
          if (!socket) {
              resolve(false);
              return;
          }
          // @ts-ignore
          socket.emit('game_end_vote:cancel', voteId, (res: any) => {
              if (!res.success) {
                  toast.error(res.error || '투표 취소 실패');
                  playError();
                  resolve(false);
              } else {
                  toast.success('투표가 취소되었습니다');
                  setGameEndVote(null);
                  resolve(true);
              }
          });
      });
  }, [socket, playError]);

  // 거래 업데이트 콜백 등록 (실시간 갱신용)
  const setTransactionUpdateCallback = useCallback((callback: (() => void) | null) => {
    transactionUpdateCallbackRef.current = callback;
  }, []);

  return {
    room,
    error,
    connected,
    activeVote,
    rankings,
    gameEndVote,  // T062
    bankReceiveVote,  // Task 5.4
    cancelRequest,  // Task 6.4
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
    requestBankReceive,  // Task 5.3
    sellAsset,
    requestCancelTransaction,  // Task 6.5
    respondCancelTransaction,  // Task 6.5
    renameAsset,  // Task 7.3
    requestGameEnd,  // T062
    castGameEndVote,  // T062
    cancelGameEndVote,  // T049
    // 거래 업데이트 콜백 등록 (실시간 갱신용)
    setTransactionUpdateCallback
  };
};


