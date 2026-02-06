import { store } from '../models/store.js';

// getRoomId: 플레이어 ID로 방 ID를 조회 (인덱스 기반 O(1))
export function getRoomId(playerId: string): string | null {
  return store.playerToRoom.get(playerId) ?? null;
}

// formatManwon: 금액을 만원 단위로 변환
export function formatManwon(amount: number): string {
  if (amount === 0) return '0원';
  const manwon = amount / 10000;
  if (Number.isInteger(manwon)) {
    return `${manwon.toLocaleString()}만원`;
  } else {
    return `${manwon.toFixed(2).replace(/\.?0+$/, '')}만원`;
  }
}
