import React from 'react';

interface Props {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export const TransactionForm: React.FC<Props> = ({ children, onSubmit, className = '' }) => (
  <form onSubmit={onSubmit} className={`p-5 space-y-6 ${className}`}>
    {children}
  </form>
);
