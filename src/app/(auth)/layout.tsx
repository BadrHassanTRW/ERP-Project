'use client';

import React from 'react';

/**
 * Auth Layout
 * Provides a centered layout for authentication pages
 * with the Dark Blue Dashboard ERP design system
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1E293B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
