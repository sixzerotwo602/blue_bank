import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './useSocket';
import type { Room, Vote } from '@blue-banker/shared';
import toast from 'react-hot-toast';
import useSound from 'use-sound';

export const useGame = (roomId?: string) => {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeVote, setActiveVote] = useState<Vote | null>(null);

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

    socket.on('room:sync', onSync);
    socket.on('game:started', onGameStarted);
    socket.on('vote:started', onVoteStarted);
    socket.on('vote:updated', onVoteUpdated);
    socket.on('vote:ended', onVoteEnded);

    return () => {
      socket.off('room:sync', onSync);
      socket.off('game:started', onGameStarted);
      socket.off('vote:started', onVoteStarted);
      socket.off('vote:updated', onVoteUpdated);
      socket.off('vote:ended', onVoteEnded);
    };
  }, [socket, roomId, navigate, playSuccess, playError]);

  const createRoom = useCallback((nickname: string) => {
    if (!socket) return;
    socket.emit('room:create', nickname, (res) => {
      if (res && res.roomId) {
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

  const requestTransaction = useCallback((type: string, amount: number, toId?: string, assetType?: 'LAND' | 'BUILDING') => {
    return new Promise<boolean>((resolve) => {
        if (!socket) {
            resolve(false);
            return;
        }
        // @ts-ignore Shared type update might not be reflected in frontend dev server yet without restart
        socket.emit('tx:request', { type, amount, toId, assetType }, (res: any) => {
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

  return {
    room,
    error,
    connected,
    activeVote,
    createRoom,
    joinRoom,
    startGame,
    requestTransaction,
    requestFund,
    castVote
  };
};
