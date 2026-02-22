import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const VotePanel: React.FC<Props> = ({ children }) => (
  <div className="p-4 space-y-4">{children}</div>
);
