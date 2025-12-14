'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * Dashboard layout wrapper
 * Wraps all dashboard routes with authentication protection and layout
 * Validates: Requirements 5.1, 14.1
 */
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
