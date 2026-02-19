import React from 'react';
import { BaseButton } from '../atoms';

interface Props {
  title: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader: React.FC<Props> = ({ title, onClose, className = '' }) => (
  <div className={`p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 ${className}`}>
    <h3 className="font-bold text-lg text-white">{title}</h3>
    {onClose && (
      <BaseButton variant="ghost" size="sm" onClick={onClose} className="!px-2 !py-1 text-slate-400 hover:text-white">
        ✕
      </BaseButton>
    )}
  </div>
);
