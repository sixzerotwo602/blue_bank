import React, { useState } from 'react';
import type { Player, Asset } from '@blue-banker/shared';
import { getAssetDisplayInfo } from '../../../utils/transactionLabels';
import { MoneyDisplay } from '../../../ui';
import { RenameAssetModal } from '../../../components/RenameAssetModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  isCurrentUser?: boolean;
  onRenameAsset?: (assetId: string, newName: string) => void;
}

/**
 * T034: PlayerAssetModal 컴포넌트
 * 랭킹에서 플레이어 클릭 시 자산 현황 표시
 * Task 7.2: 본인 자산일 경우 토지명 수정 가능
 */
export const PlayerAssetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  isCurrentUser = false,
  onRenameAsset,
}) => {
  // Task 7.2: 자산명 수정 모달 상태
  const [renameAsset, setRenameAsset] = useState<Asset | null>(null);

  if (!isOpen || !player) return null;

  // 자산을 토지, 건물 순으로 정렬
  const sortedAssets = [...player.assets].sort((a, b) => {
    if (a.type === 'LAND' && b.type !== 'LAND') return -1;
    if (a.type !== 'LAND' && b.type === 'LAND') return 1;
    return (b.value || 0) - (a.value || 0);
  });

  // Task 7.2: 토지 클릭 핸들러
  const handleAssetClick = (asset: Asset) => {
    // 본인 자산이고, 토지이고, 수정 콜백이 있을 때만 수정 모달 열기
    if (isCurrentUser && asset.type === 'LAND' && onRenameAsset) {
      setRenameAsset(asset);
    }
  };

  // Task 7.2: 자산명 수정 제출
  const handleRenameSubmit = (assetId: string, newName: string) => {
    if (onRenameAsset) {
      onRenameAsset(assetId, newName);
    }
    setRenameAsset(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-900/50 to-cyan-900/50">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <span>👤</span>
              {player.nickname}님의 자산 현황
              {isCurrentUser && <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">나</span>}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="p-4 space-y-4">
            {/* 현금 및 부동산 가치 요약 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">현금</div>
                <div className="text-lg font-bold text-green-400"><MoneyDisplay amount={player.cash} /></div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">부동산 가치</div>
                <div className="text-lg font-bold text-blue-400"><MoneyDisplay amount={player.assetValue} /></div>
              </div>
            </div>

            {/* 총 자산 */}
            <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">총 자산 <span className="text-slate-600">(클릭: 단위 변경)</span></div>
              <div className="text-xl font-bold text-white"><MoneyDisplay amount={player.cash + player.assetValue} clickable /></div>
            </div>

            {/* 보유 자산 목록 */}
            <div>
              <div className="text-sm text-slate-400 mb-2">
                보유 자산 ({player.assets.length}개)
                {isCurrentUser && <span className="text-emerald-400 ml-2">• 토지 클릭 시 이름 수정</span>}
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {sortedAssets.length === 0 ? (
                  <div className="text-center text-slate-500 py-4">
                    <div className="text-2xl mb-1">📭</div>
                    <p className="text-sm">보유 자산 없음</p>
                  </div>
                ) : (
                  sortedAssets.map((asset: Asset) => {
                    const displayInfo = getAssetDisplayInfo(asset);
                    const isLand = asset.type === 'LAND';
                    const canEdit = isCurrentUser && isLand && onRenameAsset;

                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleAssetClick(asset)}
                        className={`bg-slate-800 p-3 rounded-lg flex items-center gap-3 transition-all ${
                          canEdit
                            ? 'cursor-pointer hover:bg-slate-700 hover:border-emerald-500/50 border border-transparent'
                            : ''
                        }`}
                      >
                        <div className="text-xl">{displayInfo.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm flex items-center gap-2">
                            {displayInfo.primary}
                            {canEdit && <span className="text-xs text-emerald-400">✏️</span>}
                          </div>
                          <div className="text-xs text-slate-400">{displayInfo.secondary}</div>
                        </div>
                        <div className="text-sm font-bold text-blue-300"><MoneyDisplay amount={asset.value} /></div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task 7.2: 자산명 수정 모달 */}
      <RenameAssetModal
        isOpen={renameAsset !== null}
        asset={renameAsset}
        onClose={() => setRenameAsset(null)}
        onSubmit={handleRenameSubmit}
      />
    </>
  );
};
