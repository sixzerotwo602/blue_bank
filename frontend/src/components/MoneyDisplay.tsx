import React, { useState } from 'react';
import { formatManwon } from '../utils/formatMoney';

interface Props {
  amount: number;
  className?: string;
  showCurrency?: boolean;
  useManwon?: boolean; // T018-T019: 만원 단위 표시 옵션
  clickable?: boolean; // T038-T039: 클릭 시 만원↔숫자 토글
}

export const MoneyDisplay: React.FC<Props> = ({
  amount,
  className = '',
  showCurrency = true,
  useManwon: initialUseManwon = true,  // 기본값: 만원 단위 사용
  clickable = false  // T039: 기본값은 클릭 불가
}) => {
  // T038: 내부 상태로 만원↔숫자 토글 관리
  const [useManwon, setUseManwon] = useState(initialUseManwon);

  const handleClick = () => {
    if (clickable) {
      setUseManwon(prev => !prev);
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
        title={clickable ? '클릭하여 표시 형식 변경' : undefined}
      >
        {showCurrency ? formatted : formatted.replace(/[만]?원$/, '')}
      </span>
    );
  }

  // 원 단위 표시 (기존 로직)
  return (
    <span
      className={`${baseClass} ${clickableClass}`}
      onClick={handleClick}
      title={clickable ? '클릭하여 표시 형식 변경' : undefined}
    >
      {amount?.toLocaleString('ko-KR')}
      {showCurrency && <span className="text-[0.8em] ml-1 opacity-70">원</span>}
    </span>
  );
};

