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
    // Use centralized BACKEND_URL logic
    const socketUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    
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

