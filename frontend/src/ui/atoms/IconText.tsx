import React from 'react';

interface Props {
  icon?: React.ReactNode;
  text: React.ReactNode;
  className?: string;
}

export const IconText: React.FC<Props> = ({ icon, text, className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    {icon}
    <span>{text}</span>
  </span>
);
