import type { Transaction, TransactionType, Asset, Room, Player } from '@blue-banker/shared';
import { randomUUID } from 'crypto';

/** private 메서드의 공통 반환 타입 */
interface TransactionResult {
  fromId: string | 'BANK' | 'FUND';
  toId: string | 'BANK' | 'FUND';
  txDescription?: string;
  overrideAmount?: number;
}

interface TransactionPayload {
  type: TransactionType;
  amount: number;
  toId?: string;
  assetType?: 'LAND' | 'BUILDING';
  buildingType?: 'HOTEL' | 'BUILDING' | 'VILLA';
  landName?: string;
  selectedLandId?: string;
  villaCount?: number;
  reason?: string;
  bundleSell?: boolean;
}

/**
 * 8가지 거래 유형 순수 함수 — Room/Player 상태를 직접 변경한다
 */
export function processTransaction(room: Room, requesterId: string, payload: TransactionPayload): Transaction {
  const player = room.players.find(p => p.id === requesterId);
  if (!player) throw new Error('플레이어를 찾을 수 없습니다');

  // SELL_ASSET은 금액을 백엔드에서 계산하므로 검증 제외
  if (payload.type !== 'SELL_ASSET' && payload.amount <= 0) {
    throw new Error('금액은 0보다 커야 합니다');
  }

  let result: TransactionResult;

  switch (payload.type) {
    case 'TRANSFER':
      result = processTransfer(room, player, payload);
      break;
    case 'BUY_ASSET':
      result = processBuyAsset(room, player, payload);
      break;
    case 'SELL_ASSET':
      result = processSellAsset(room, player, payload);
      break;
    case 'PAY_COST':
      result = processPayCost(player, payload);
      break;
    case 'DONATE':
      result = processDonate(room, player, payload);
      break;
    case 'SALARY':
      result = processSalary(player, payload);
      break;
    case 'WELFARE_RECEIVE':
      result = processWelfareReceive(room, player, payload);
      break;
    case 'BANK_RECEIVE':
      result = processBankReceive(player, payload, requesterId);
      break;
    default:
      throw new Error('잘못된 거래 유형입니다');
  }

  const finalAmount = result.overrideAmount !== undefined ? result.overrideAmount : payload.amount;

  const transaction: Transaction = {
    id: randomUUID(),
    type: payload.type,
    amount: finalAmount,
    fromId: result.fromId,
    toId: result.toId,
    timestamp: Date.now(),
    description: result.txDescription || payload.type,
    status: 'COMPLETED',
    ...(payload.type === 'BANK_RECEIVE' && payload.reason ? { reason: payload.reason } : {})
  };

  return transaction;
}

function processTransfer(room: Room, player: Player, payload: TransactionPayload): TransactionResult {
  if (!payload.toId) throw new Error('받는 사람을 선택해주세요');
  const recipient = room.players.find(p => p.id === payload.toId);
  if (!recipient) throw new Error('받는 사람을 찾을 수 없습니다');

  if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');

  player.cash -= payload.amount;
  recipient.cash += payload.amount;

  return { fromId: player.id, toId: recipient.id };
}

function processBuyAsset(room: Room, player: Player, payload: TransactionPayload): TransactionResult {
  if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
  const type = payload.assetType || 'LAND';
  const buildingType = type === 'BUILDING' ? (payload.buildingType || 'BUILDING') : undefined;

  let name: string;
  let description: string | undefined;

  if (type === 'LAND') {
    name = payload.landName?.trim() || `토지 #${player.assets.filter(a => a.type === 'LAND').length + 1}`;
    description = `토지 '${name}' 매입`;
  } else {
    const selectedLand = player.assets.find(a => a.id === payload.selectedLandId);
    const landNameStr = selectedLand?.name || '토지';

    switch (buildingType) {
      case 'HOTEL':
        name = `${landNameStr} 호텔`;
        description = `'${landNameStr}' 토지 위에 호텔 건설`;
        break;
      case 'VILLA': {
        const villaCount = payload.villaCount || 1;
        const existingVillasOnLand = player.assets.filter(
          a => a.buildingType === 'VILLA' && a.name?.startsWith(`${landNameStr} 별장`)
        ).length;
        name = `${landNameStr} 별장${existingVillasOnLand + 1}`;
        description = `'${landNameStr}' 토지 위에 별장 ${villaCount}개 건설`;
        break;
      }
      default:
        name = `${landNameStr} 빌딩`;
        description = `'${landNameStr}' 토지 위에 빌딩 건설`;
        break;
    }
  }

  player.cash -= payload.amount;
  player.assetValue += payload.amount;
  const newAsset: Asset = {
    id: randomUUID(),
    type,
    name,
    value: payload.amount,
    createdAt: Date.now()
  };
  if (buildingType) {
    newAsset.buildingType = buildingType;
  }
  if (type === 'BUILDING' && payload.selectedLandId) {
    newAsset.landId = payload.selectedLandId;
  }
  player.assets.push(newAsset);

  return { fromId: player.id, toId: 'BANK', txDescription: description };
}

function processSellAsset(room: Room, player: Player, payload: TransactionPayload): TransactionResult {
  if (!payload.toId) throw new Error('매각할 자산을 선택해주세요');
  const assetIndex = player.assets.findIndex(a => a.id === payload.toId);
  if (assetIndex === -1) throw new Error('자산을 찾을 수 없습니다');

  const asset = player.assets[assetIndex];
  if (!asset) throw new Error('자산을 찾을 수 없습니다');
  let totalValue = asset.value;
  const soldAssetNames: string[] = [asset.name || '자산'];

  if (asset.type === 'LAND' && payload.bundleSell) {
    const buildingsOnLand = player.assets.filter(
      a => a.type === 'BUILDING' && a.landId === asset.id
    );

    for (const building of buildingsOnLand) {
      totalValue += building.value;
      soldAssetNames.push(building.name || '건물');
    }

    const buildingIds = buildingsOnLand.map(b => b.id);
    player.assets = player.assets.filter(a => !buildingIds.includes(a.id));
  }

  const sellPrice = Math.floor(totalValue * 0.5);

  const updatedAssetIndex = player.assets.findIndex(a => a.id === payload.toId);
  if (updatedAssetIndex !== -1) {
    player.assets.splice(updatedAssetIndex, 1);
  }
  player.assetValue -= totalValue;
  player.cash += sellPrice;

  let txDescription: string;
  if (soldAssetNames.length > 1) {
    txDescription = `'${soldAssetNames[0]}' 외 ${soldAssetNames.length - 1}건 일괄 매각 (원가: ${totalValue}원)`;
  } else {
    txDescription = `'${asset.name}' 매각 (원가: ${asset.value}원)`;
  }

  return { fromId: player.id, toId: 'BANK', txDescription, overrideAmount: sellPrice };
}

function processPayCost(player: Player, payload: TransactionPayload): TransactionResult {
  if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
  player.cash -= payload.amount;
  return { fromId: player.id, toId: 'BANK' };
}

function processDonate(room: Room, player: Player, payload: TransactionPayload): TransactionResult {
  if (player.cash < payload.amount) throw new Error('잔액이 부족합니다');
  player.cash -= payload.amount;
  room.welfareFund += payload.amount;
  return { fromId: player.id, toId: 'FUND' };
}

function processSalary(player: Player, payload: TransactionPayload): TransactionResult {
  player.cash += payload.amount;
  return { fromId: 'BANK', toId: player.id };
}

function processWelfareReceive(room: Room, player: Player, payload: TransactionPayload): TransactionResult {
  if (room.welfareFund < payload.amount) throw new Error('복지기금이 부족합니다');
  room.welfareFund -= payload.amount;
  player.cash += payload.amount;
  return { fromId: 'FUND', toId: player.id };
}

function processBankReceive(player: Player, payload: TransactionPayload, requesterId: string): TransactionResult {
  const targetId = payload.toId || requesterId;
  if (targetId !== requesterId) {
    throw new Error('본인 계좌로만 수령할 수 있습니다');
  }

  player.cash += payload.amount;

  const reasonLabels: Record<string, string> = {
    LOTTERY: '복권 당첨',
    PRIZE: '우승 상금',
    BONUS: '보너스',
    OTHER: '기타'
  };
  const reasonLabel = reasonLabels[payload.reason || ''] || '은행 지급';

  return { fromId: 'BANK', toId: player.id, txDescription: reasonLabel };
}
