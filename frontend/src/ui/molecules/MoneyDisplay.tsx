import React from 'react';
import { formatManwon } from '../../utils/formatMoney';
import { useMoneyFormat } from '../../contexts/MoneyFormatContext';

interface Props {
  amount: number;
  className?: string;
  showCurrency?: boolean;
  clickable?: boolean;
}

export const MoneyDisplay: React.FC<Props> = ({
  amount,
  className = '',
  showCurrency = true,
  clickable = false,
}) => {
  const { useManwon, toggleFormat } = useMoneyFormat();

  const handleClick = () => {
    if (clickable) toggleFormat();
  };

  const baseClass = `font-mono tracking-tight ${className}`;
  const clickableClass = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity select-none' : '';

  if (useManwon) {
    const formatted = formatManwon(amount);
    return (
      <span className={`${baseClass} ${clickableClass}`} onClick={handleClick} title={clickable ? '클릭하여 전체 금액 표시 형식 변경' : undefined}>
        {showCurrency ? formatted : formatted.replace(/[만]?원$/, '')}
      </span>
    );
  }

  return (
    <span className={`${baseClass} ${clickableClass}`} onClick={handleClick} title={clickable ? '클릭하여 전체 금액 표시 형식 변경' : undefined}>
      {amount?.toLocaleString('ko-KR')}
      {showCurrency && <span className="text-[0.8em] ml-1 opacity-70">원</span>}
    </span>
  );
};
