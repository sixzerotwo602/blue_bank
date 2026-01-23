import React, { createContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';

// Define Socket type with our events
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketContextType {
  socket: AppSocket | null;
  connected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Determine URL based on environment if needed, defaulting to localhost:3000
    const socketUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    
    // Explicitly casting to AppSocket type
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    }) as AppSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
