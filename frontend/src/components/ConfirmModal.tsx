import React from 'react';

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
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onCancel}
      />
      
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
           <h3 className="font-bold text-lg text-white">{title}</h3>
        </div>

        <div className="p-6 text-center text-slate-300 whitespace-pre-wrap">
           {message}
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-800 border-t border-slate-800">
           <button 
             onClick={onCancel}
             className="p-4 bg-slate-900 hover:bg-slate-800 text-slate-400 font-medium transition-colors"
           >
             취소
           </button>
           <button 
             onClick={onConfirm}
             className="p-4 bg-slate-900 hover:bg-blue-900/20 text-blue-400 font-bold transition-colors"
           >
             확인
           </button>
        </div>
      </div>
    </div>
  );
};
