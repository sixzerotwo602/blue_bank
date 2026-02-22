import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const DashboardTemplate: React.FC<Props> = ({ children }) => (
  <div className="min-h-screen bg-slate-950 text-white pb-24">{children}</div>
);
