import React, { useState } from 'react';
import type { Asset } from '@blue-banker/shared';
import { formatManwon } from '../utils/formatMoney';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assetId: string) => void;
  assets: Asset[];
}

const getAssetIcon = (type: string, buildingType?: string): string => {
  if (type === 'LAND') return '🏞️';
  switch (buildingType) {
    case 'HOTEL': return '🏨';
    case 'VILLA': return '🏡';
    default: return '🏢';
  }
};

const getAssetLabel = (asset: Asset): string => {
  if (asset.type === 'LAND') return '토지';
  switch (asset.buildingType) {
    case 'HOTEL': return '호텔';
    case 'VILLA': return '별장';
    default: return '빌딩';
  }
};

/**
 * T047-T050: SellAssetModal 컴포넌트
 * 플레이어가 보유 자산을 50% 가격에 매각
 */
export const SellAssetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  assets,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState(false);

  const handleSelectAsset = (assetId: string) => {
    setSelectedAsset(assetId);
    setConfirmMode(true);
  };

  const handleConfirmSell = () => {
    if (!selectedAsset) return;
    onSubmit(selectedAsset);
    setSelectedAsset(null);
    setConfirmMode(false);
    onClose();
  };

  const handleCancel = () => {
    setSelectedAsset(null);
    setConfirmMode(false);
  };

  if (!isOpen) return null;

  const selectedAssetData = assets.find(a => a.id === selectedAsset);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-red-900/50 to-orange-900/50">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>📤</span>
            자산 매각 (반값)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* T049: 매각 확인 모달 */}
          {confirmMode && selectedAssetData ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl mb-2">{getAssetIcon(selectedAssetData.type, selectedAssetData.buildingType)}</div>
                <div className="text-xl font-bold text-white mb-1">{selectedAssetData.name}</div>
                <div className="text-slate-400">{getAssetLabel(selectedAssetData)}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">원래 가치</span>
                  <span className="text-white">{formatManwon(selectedAssetData.value)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-300 font-bold">매각 금액 (50%)</span>
                  <span className="text-red-400 font-bold">{formatManwon(Math.floor(selectedAssetData.value * 0.5))}</span>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                ⚠️ 자산 매각 시 원래 가치의 50%만 받을 수 있습니다. 이 작업은 되돌릴 수 없습니다.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmSell}
                  className="flex-1 bg-red-600 hover:bg-red-500 p-3 rounded-xl font-bold transition-colors"
                >
                  매각하기
                </button>
              </div>
            </div>
          ) : (
            /* T048, T050: 보유 자산 목록 표시 */
            <div className="space-y-2">
              {assets.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p>보유 자산이 없습니다.</p>
                </div>
              ) : (
                assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleSelectAsset(asset.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-all flex items-center gap-3 text-left"
                  >
                    <div className="text-2xl">{getAssetIcon(asset.type, asset.buildingType)}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{asset.name}</div>
                      <div className="text-sm text-slate-400">{getAssetLabel(asset)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-sm line-through">{formatManwon(asset.value)}</div>
                      <div className="text-red-400 font-bold">{formatManwon(Math.floor(asset.value * 0.5))}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
