'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, children, className = '', ...props }, ref) => {
    const isDisabled = disabled || loading;

    const baseStyles = 'px-4 py-2 rounded-md font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2';
    
    const variantStyles = {
      primary: `bg-[#4A90E2] text-white hover:bg-[#6B80E5] disabled:bg-[#718096] disabled:text-[#A0AEC0]`,
      secondary: `bg-transparent border border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10 disabled:border-[#718096] disabled:text-[#718096]`,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
