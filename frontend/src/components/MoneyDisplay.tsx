import React from 'react';

interface Props {
  amount: number;
  className?: string;
  showCurrency?: boolean;
}

export const MoneyDisplay: React.FC<Props> = ({ amount, className = '', showCurrency = true }) => {
  return (
    <span className={`font-mono tracking-tight ${className}`}>
      {amount?.toLocaleString('ko-KR')}
      {showCurrency && <span className="text-[0.8em] ml-1 opacity-70">원</span>}
    </span>
  );
};
