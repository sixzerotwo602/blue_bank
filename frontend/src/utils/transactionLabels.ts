/**
 * T001: 거래 유형 한글 매핑
 * 거래 유형 코드를 한글 라벨로 변환
 */
import { TransactionType, Asset } from 'shared';

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  TRANSFER: '송금',
  BUY_ASSET: '자산 매입',
  PAY_COST: '은행 납부',
  DONATE: '복지기금 기부',
  SALARY: '월급',
  WELFARE_RECEIVE: '복지기금 수령',
  BANK_RECEIVE: '은행 수령',
  SELL_ASSET: '자산 매각',
};

export const TRANSACTION_ICONS: Record<TransactionType, string> = {
  TRANSFER: '💸',
  BUY_ASSET: '🏠',
  PAY_COST: '🏦',
  DONATE: '🤝',
  SALARY: '💵',
  WELFARE_RECEIVE: '🎁',
  BANK_RECEIVE: '🎰',
  SELL_ASSET: '📤',
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  LAND: '토지',
  HOTEL: '호텔',
  BUILDING: '빌딩',
  VILLA: '별장',
};

export const ASSET_TYPE_ICONS: Record<string, string> = {
  LAND: '🏞️',
  HOTEL: '🏨',
  BUILDING: '🏢',
  VILLA: '🏡',
};

/**
 * T006: 자산 표시 정보 생성
 * 자산 매각 시 "토지명 + 자산유형" 형태로 표시하기 위한 헬퍼 함수
 */
export interface AssetDisplayInfo {
  primary: string;    // 주 표시명 (예: "서울", "프랑스 빌딩", "독일 별장1")
  secondary: string;  // 자산 유형 (예: "토지", "빌딩", "별장")
  icon: string;       // 이모지 아이콘
}

export function getAssetDisplayInfo(asset: Asset): AssetDisplayInfo {
  // 토지인 경우
  if (asset.type === 'LAND') {
    return {
      primary: asset.name || '토지',
      secondary: '토지',
      icon: ASSET_TYPE_ICONS.LAND,
    };
  }

  // 건물인 경우 (HOTEL, BUILDING, VILLA)
  const buildingType = asset.buildingType || 'BUILDING';
  const typeName = ASSET_TYPE_LABELS[buildingType] || '건물';
  const icon = ASSET_TYPE_ICONS[buildingType] || '🏢';

  // 별장인 경우 번호 표시 (별장1, 별장2 등)
  if (buildingType === 'VILLA') {
    // asset.name에 "토지명 별장N" 형태가 저장되어 있다고 가정
    // 또는 별도 필드가 없으면 기본값 사용
    const villaName = asset.name || '별장';
    return {
      primary: villaName,
      secondary: '별장',
      icon,
    };
  }

  // 호텔, 빌딩인 경우
  const displayName = asset.name || `${typeName}`;
  return {
    primary: displayName,
    secondary: typeName,
    icon,
  };
}
