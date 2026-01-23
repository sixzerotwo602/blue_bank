import { io } from 'socket.io-client';
import { useContext } from 'react';
import { SocketContext } from '../services/socketContext';

const BACKEND_URL = import.meta.env.PROD
  ? 'https://game.yourdomain.com' // Placeholder for actual backend domain
  : 'http://localhost:3000';

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
