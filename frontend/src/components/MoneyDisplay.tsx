import React from 'react';
import { formatManwon } from '../utils/formatMoney';
import { useMoneyFormat } from '../contexts/MoneyFormatContext';

interface Props {
  amount: number;
  className?: string;
  showCurrency?: boolean;
  clickable?: boolean; // 클릭 시 전역 만원↔숫자 토글
}

export const MoneyDisplay: React.FC<Props> = ({
  amount,
  className = '',
  showCurrency = true,
  clickable = false
}) => {
  const { useManwon, toggleFormat } = useMoneyFormat();

  const handleClick = () => {
    if (clickable) {
      toggleFormat();
    }
  };

  const baseClass = `font-mono tracking-tight ${className}`;
  const clickableClass = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity select-none' : '';

  if (useManwon) {
    // 만원 단위 표시 (formatManwon은 이미 "원" 또는 "만원" 포함)
    const formatted = formatManwon(amount);
    return (
      <span
        className={`${baseClass} ${clickableClass}`}
        onClick={handleClick}
        title={clickable ? '클릭하여 전체 금액 표시 형식 변경' : undefined}
      >
        {showCurrency ? formatted : formatted.replace(/[만]?원$/, '')}
      </span>
    );
  }

  // 원 단위 표시
  return (
    <span
      className={`${baseClass} ${clickableClass}`}
      onClick={handleClick}
      title={clickable ? '클릭하여 전체 금액 표시 형식 변경' : undefined}
    >
      {amount?.toLocaleString('ko-KR')}
      {showCurrency && <span className="text-[0.8em] ml-1 opacity-70">원</span>}
    </span>
  );
};

