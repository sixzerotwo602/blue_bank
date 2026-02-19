import React from 'react';
import { ModalBackdrop, ModalHeader, BaseButton } from '../../../ui';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <ModalBackdrop onClick={onCancel} className="animate-fade-in" />
      
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <ModalHeader title={title} />

        <div className="p-6 text-center text-slate-300 whitespace-pre-wrap">
           {message}
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-800 border-t border-slate-800">
           <BaseButton onClick={onCancel} variant="ghost" className="!p-4 bg-slate-900 hover:bg-slate-800 text-slate-400 font-medium rounded-none">취소</BaseButton>
           <BaseButton onClick={onConfirm} variant="ghost" className="!p-4 bg-slate-900 hover:bg-blue-900/20 text-blue-400 font-bold rounded-none">확인</BaseButton>
        </div>
      </div>
    </div>
  );
};
