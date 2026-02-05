import React, { useState } from 'react';
import type { Asset } from '@blue-banker/shared';
// T029: getAssetDisplayInfo import
import { getAssetDisplayInfo } from '../utils/transactionLabels';
import { MoneyDisplay } from './MoneyDisplay';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assetId: string, bundleSell?: boolean) => void;
  assets: Asset[];
}

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
  // Task 4.2: 건물 일괄 매각 경고 상태
  const [showBuildingWarning, setShowBuildingWarning] = useState(false);
  const [buildingsOnLand, setBuildingsOnLand] = useState<Asset[]>([]);

  const handleSelectAsset = (assetId: string) => {
    const selectedAssetData = assets.find(a => a.id === assetId);

    // Task 4.2: 토지 선택 시 해당 토지 위의 건물 확인
    if (selectedAssetData?.type === 'LAND') {
      const buildings = assets.filter(
        asset => asset.type === 'BUILDING' && asset.landId === assetId
      );
      if (buildings.length > 0) {
        setSelectedAsset(assetId);
        setBuildingsOnLand(buildings);
        setShowBuildingWarning(true);
        return;
      }
    }

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

  // Task 4.2: 건물 일괄 매각 확인
  const handleBundleSell = () => {
    if (!selectedAsset) return;
    onSubmit(selectedAsset, true); // bundleSell = true
    setSelectedAsset(null);
    setConfirmMode(false);
    setShowBuildingWarning(false);
    setBuildingsOnLand([]);
    onClose();
  };

  // Task 4.2: 건물 경고 모달 닫기
  const handleCancelBuildingWarning = () => {
    setSelectedAsset(null);
    setShowBuildingWarning(false);
    setBuildingsOnLand([]);
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

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Task 4.2: 건물 일괄 매각 경고 모달 */}
          {showBuildingWarning && selectedAssetData ? (() => {
            const displayInfo = getAssetDisplayInfo(selectedAssetData);
            const totalBuildingValue = buildingsOnLand.reduce((sum, b) => sum + b.value, 0);
            const totalValue = selectedAssetData.value + totalBuildingValue;
            return (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">⚠️</div>
                  <div className="text-xl font-bold text-yellow-400 mb-1">건물이 있는 토지입니다!</div>
                  <div className="text-slate-400">{displayInfo.primary}</div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
                  이 토지 위에 {buildingsOnLand.length}개의 건물이 있습니다.
                  토지를 매각하면 건물도 함께 매각됩니다.
                </div>

                <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-sm text-slate-400 mb-2">매각 대상:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">🏞️ {displayInfo.primary}</span>
                    <span className="text-white"><MoneyDisplay amount={selectedAssetData.value} /></span>
                  </div>
                  {buildingsOnLand.map((building) => {
                    const buildingInfo = getAssetDisplayInfo(building);
                    return (
                      <div key={building.id} className="flex justify-between">
                        <span className="text-slate-300">{buildingInfo.icon} {buildingInfo.primary}</span>
                        <span className="text-white"><MoneyDisplay amount={building.value} /></span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span className="text-slate-300 font-bold">총 매각 금액 (50%)</span>
                    <span className="text-red-400 font-bold"><MoneyDisplay amount={Math.floor(totalValue * 0.5)} /></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCancelBuildingWarning}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleBundleSell}
                    className="flex-1 bg-red-600 hover:bg-red-500 p-3 rounded-xl font-bold transition-colors"
                  >
                    일괄 매각
                  </button>
                </div>
              </div>
            );
          })() : confirmMode && selectedAssetData ? (() => {
            const displayInfo = getAssetDisplayInfo(selectedAssetData);
            return (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl mb-2">{displayInfo.icon}</div>
                <div className="text-xl font-bold text-white mb-1">{displayInfo.primary}</div>
                <div className="text-slate-400">{displayInfo.secondary}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">원래 가치</span>
                  <span className="text-white"><MoneyDisplay amount={selectedAssetData.value} /></span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-300 font-bold">매각 금액 (50%)</span>
                  <span className="text-red-400 font-bold"><MoneyDisplay amount={Math.floor(selectedAssetData.value * 0.5)} /></span>
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
          );})() : (
            /* T030-T031: 보유 자산 목록 표시 - getAssetDisplayInfo 사용 */
            <div className="space-y-2">
              {assets.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p>보유 자산이 없습니다.</p>
                </div>
              ) : (
                assets.map((asset) => {
                  const displayInfo = getAssetDisplayInfo(asset);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset.id)}
                      className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-all flex items-center gap-3 text-left"
                    >
                      <div className="text-2xl">{displayInfo.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{displayInfo.primary}</div>
                        <div className="text-sm text-slate-400">{displayInfo.secondary}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm line-through"><MoneyDisplay amount={asset.value} /></div>
                        <div className="text-red-400 font-bold"><MoneyDisplay amount={Math.floor(asset.value * 0.5)} /></div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
