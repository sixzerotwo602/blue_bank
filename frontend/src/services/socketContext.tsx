import React, { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

// Define Socket type with our events
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketContextType {
  socket: AppSocket | null;
  connected: boolean;
  // Reconnection state (T058)
  reconnecting: boolean;
  reconnectAttempt: number;
  reconnectFailed: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  reconnecting: false,
  reconnectAttempt: 0,
  reconnectFailed: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  // Reconnection state (T058)
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [reconnectFailed, setReconnectFailed] = useState(false);

  useEffect(() => {
    // Determine backend URL based on environment
    const getBackendUrl = (): string => {
      // 1. 환경변수가 설정되어 있으면 우선 사용 (프로덕션)
      if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
      }

      // 2. 프로덕션 도메인이면 프로덕션 백엔드 사용
      const hostname = window.location.hostname;
      if (hostname.includes('pages.dev') || hostname.includes('blue-banker')) {
        return 'https://blue-banker-backend.onrender.com'; // 프로덕션 백엔드
      }

      // 3. 개발 환경: 현재 접속한 호스트의 3000 포트 사용
      //    - localhost:5173 → localhost:3000
      //    - 192.168.x.x:5173 → 192.168.x.x:3000
      const protocol = window.location.protocol;
      return `${protocol}//${hostname}:3000`;
    };

    const socketUrl = getBackendUrl();
    console.log('Connecting to backend:', socketUrl);
    
    // Configure auto-reconnection (T053)
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true, // Consistency with useSocket.ts
      // Reconnection settings (T053)
      reconnection: true,
      reconnectionAttempts: 5, // Max 5 attempts
      reconnectionDelay: 2000, // Start with 2 seconds
      reconnectionDelayMax: 32000, // Max 32 seconds (exponential backoff)
    }) as AppSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setReconnecting(false);
      setReconnectAttempt(0);
      setReconnectFailed(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Reconnection events (T055-T057)
    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      setReconnecting(true);
      setReconnectAttempt(attempt);
    });

    newSocket.io.on('reconnect', () => {
      console.log('Reconnected successfully');
      setReconnecting(false);
      setReconnectAttempt(0);
      setReconnectFailed(false);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.log('Reconnection failed');
      setReconnecting(false);
      setReconnectFailed(true);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      reconnecting,
      reconnectAttempt,
      reconnectFailed
    }}>
      {children}
    </SocketContext.Provider>
  );
};

