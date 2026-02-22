import React from 'react';

interface Props {
  onClick?: () => void;
  className?: string;
}

export const ModalBackdrop: React.FC<Props> = ({ onClick, className = '' }) => (
  <div
    className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${className}`}
    onClick={onClick}
  />
);
