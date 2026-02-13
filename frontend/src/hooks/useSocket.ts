import { io } from 'socket.io-client';
import { useContext } from 'react';
import { SocketContext } from '../services/socketContext';

// Same-Origin이면 빈 문자열로 현재 페이지의 origin 자동 사용
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
