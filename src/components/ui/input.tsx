'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', error = false, className = '', ...props }, ref) => {
    const baseStyles = `
      w-full bg-[#3B4B63] border text-white rounded-md px-3 py-2
      placeholder:text-[#718096] transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-[#6772E5]/20
    `;
    
    const borderStyles = error
      ? 'border-[#E53E3E] focus:border-[#E53E3E]'
      : 'border-[#4A5568] focus:border-[#6772E5]';

    return (
      <input
        ref={ref}
        type={type}
        className={`${baseStyles} ${borderStyles} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
