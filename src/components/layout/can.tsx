'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth-store';

export interface CanProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Can component for permission-based conditional rendering
 * Validates: Requirements 14.3
 * @param children - Content to render if user has permission
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - If true, user must have all permissions; if false, any permission suffices
 * @param fallback - Optional content to render if user lacks permission
 */
export const Can: React.FC<CanProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();

  // Check if user has required permission(s)
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Render children if authorized, fallback otherwise
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Helper function to check permission outside of React components
 * Useful for conditional logic in event handlers
 */
export const checkPermission = (permission: string): boolean => {
  return useAuthStore.getState().hasPermission(permission);
};

/**
 * Helper function to check any of multiple permissions outside of React components
 */
export const checkAnyPermission = (permissions: string[]): boolean => {
  return useAuthStore.getState().hasAnyPermission(permissions);
};

/**
 * Helper function to check all permissions outside of React components
 */
export const checkAllPermissions = (permissions: string[]): boolean => {
  return useAuthStore.getState().hasAllPermissions(permissions);
};

export default Can;
