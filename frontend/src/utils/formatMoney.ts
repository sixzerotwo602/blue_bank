/**
 * T013: 만원 단위 포맷 유틸리티 함수
 * 금액을 만원 단위로 변환하여 표시
 */
export function formatManwon(amount: number): string {
  if (amount === 0) return '0원';

  const manwon = amount / 10000;

  if (Number.isInteger(manwon)) {
    return `${manwon.toLocaleString()}만원`;
  } else {
    // 소수점 2자리까지 (0.35만원) - 불필요한 0 제거
    return `${manwon.toFixed(2).replace(/\.?0+$/, '')}만원`;
  }
}

/**
 * 원 단위 포맷 (기존 로직 유지용)
 */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}
