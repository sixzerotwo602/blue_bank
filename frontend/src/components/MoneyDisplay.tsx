import React from 'react';
import { formatManwon } from '../utils/formatMoney';

interface Props {
  amount: number;
  className?: string;
  showCurrency?: boolean;
  useManwon?: boolean; // T018-T019: 만원 단위 표시 옵션
}

export const MoneyDisplay: React.FC<Props> = ({ 
  amount, 
  className = '', 
  showCurrency = true,
  useManwon = true  // 기본값: 만원 단위 사용
}) => {
  if (useManwon) {
    // 만원 단위 표시 (formatManwon은 이미 "원" 또는 "만원" 포함)
    const formatted = formatManwon(amount);
    return (
      <span className={`font-mono tracking-tight ${className}`}>
        {showCurrency ? formatted : formatted.replace(/[만]?원$/, '')}
      </span>
    );
  }

  // 원 단위 표시 (기존 로직)
  return (
    <span className={`font-mono tracking-tight ${className}`}>
      {amount?.toLocaleString('ko-KR')}
      {showCurrency && <span className="text-[0.8em] ml-1 opacity-70">원</span>}
    </span>
  );
};

