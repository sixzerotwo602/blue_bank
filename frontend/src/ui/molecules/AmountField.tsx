import React from 'react';
import { TextInput } from '../atoms';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

export const AmountField: React.FC<Props> = ({ value, onChange, placeholder = '0', className = '' }) => (
  <TextInput
    type="text"
    inputMode="numeric"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rightAdornment={<span className="font-bold">원</span>}
    className={`text-2xl font-mono text-right rounded-xl py-4 ${className}`}
  />
);
