import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const HomeTemplate: React.FC<Props> = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">{children}</div>
);
