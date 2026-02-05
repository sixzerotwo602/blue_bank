import React from 'react';
import { InputProps } from './Input.types';

export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`bg-slate-900 border ${error ? 'border-danger' : 'border-slate-700'} rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none transition-colors ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
};
