import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const LobbyTemplate: React.FC<Props> = ({ children }) => (
  <div className="min-h-screen bg-slate-900 text-white p-6">{children}</div>
);
