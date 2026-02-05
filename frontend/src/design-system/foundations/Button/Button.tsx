import React from 'react';
import { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl font-medium transition-colors active:scale-95';

  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-500 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    danger: 'bg-danger hover:bg-red-500 text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
