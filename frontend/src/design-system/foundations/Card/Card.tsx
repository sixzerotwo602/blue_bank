import React from 'react';
import { CardProps } from './Card.types';

export const Card: React.FC<CardProps> = ({
  children,
  gradient = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-lg';
  const gradientStyles = gradient ? 'bg-gradient-to-br from-slate-900 to-slate-800' : '';

  return (
    <div className={`${baseStyles} ${gradientStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
