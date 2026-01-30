import { io } from 'socket.io-client';
import { useContext } from 'react';
import { SocketContext } from '../services/socketContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:15645";

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
