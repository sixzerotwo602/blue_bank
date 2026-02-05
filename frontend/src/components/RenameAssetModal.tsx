import React, { useState, useEffect } from 'react';
import type { Asset } from '@blue-banker/shared';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (assetId: string, newName: string) => void;
}

/**
 * Task 7.2: RenameAssetModal 컴포넌트
 * 토지 이름 수정 모달
 */
export const RenameAssetModal: React.FC<Props> = ({
  isOpen,
  asset,
  onClose,
  onSubmit,
}) => {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      setNewName(asset.name || '');
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim()) {
      toast.error('토지명을 입력해주세요');
      return;
    }

    if (newName.trim().length > 20) {
      toast.error('토지명은 20자 이하여야 합니다');
      return;
    }

    onSubmit(asset.id, newName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-900/50 to-teal-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>✏️</span>
            토지명 수정
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">현재 토지명</label>
            <div className="bg-slate-800/50 rounded-lg p-3 text-slate-300">
              {asset.name || '(이름 없음)'}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 font-medium block mb-2">새 토지명</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="새로운 토지명 입력..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              maxLength={20}
              autoFocus
            />
            <div className="text-xs text-slate-500 mt-1 text-right">
              {newName.length}/20
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold transition-colors text-slate-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || newName.trim() === asset.name}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 p-3 rounded-xl font-bold transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
