'use client';

import React from 'react';
import type { BadgeVariant } from '@/types';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#4A5568] text-[#A0AEC0]',
  success: 'bg-[#38A169] text-white',
  warning: 'bg-[#DD6B20] text-white',
  danger: 'bg-[#E53E3E] text-white',
  info: 'bg-[#3182CE] text-white',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  size = 'sm',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
