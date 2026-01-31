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

/**
 * T005: 만원 단위 문자열을 원 단위 숫자로 변환
 * "586만원" → 5860000
 * "5,860,000" → 5860000
 */
export function parseManwonToWon(displayAmount: string): number {
  if (!displayAmount) return 0;

  // "586만원" 형태인 경우
  if (displayAmount.includes('만원')) {
    const manwon = parseFloat(displayAmount.replace(/[^0-9.]/g, ''));
    return Math.floor(manwon * 10000);
  }

  // "5,860,000원" 또는 "5,860,000" 형태인 경우
  return parseInt(displayAmount.replace(/[^0-9]/g, ''), 10) || 0;
}
