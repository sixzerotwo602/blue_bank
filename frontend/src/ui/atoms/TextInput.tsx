import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  rightAdornment?: React.ReactNode;
}

export const TextInput: React.FC<Props> = ({ rightAdornment, className = '', ...props }) => {
  if (!rightAdornment) {
    return (
      <input
        className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 ${className}`}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      <input
        className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-blue-500 ${className}`}
        {...props}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">{rightAdornment}</span>
    </div>
  );
};
