'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
}

/**
 * Access Denied component displayed when user lacks required permissions
 */
const AccessDenied: React.FC = () => (
  <div className="min-h-screen bg-[#1E293B] flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
      <p className="text-[#A0AEC0] mb-6">
        You do not have permission to access this page.
      </p>
      <a
        href="/dashboard"
        className="inline-block px-4 py-2 bg-[#4A90E2] text-white rounded-md hover:bg-[#6B80E5] transition-colors duration-200"
      >
        Go to Dashboard
      </a>
    </div>
  </div>
);

/**
 * Loading component displayed while checking authentication
 */
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#1E293B] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#4A90E2]" />
  </div>
);

/**
 * ProtectedRoute component that checks authentication and permissions
 * Validates: Requirements 14.1
 * @param children - Child components to render if authorized
 * @param permission - Single permission required to access the route
 * @param permissions - Array of permissions (used with requireAll)
 * @param requireAll - If true, user must have all permissions; if false, any permission suffices
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
}) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Get auth state directly - check token and user instead of isAuthenticated
  const { token, user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();
  
  // Check if actually authenticated (has both token and user)
  const isActuallyAuthenticated = Boolean(token && user);

  // Wait for hydration on client side
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Redirect to login if not authenticated (after hydration)
  useEffect(() => {
    if (isHydrated && !isActuallyAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isActuallyAuthenticated, router]);

  // Show loading while hydrating
  if (!isHydrated) {
    return <LoadingScreen />;
  }

  // If not authenticated, show loading while redirect happens
  if (!isActuallyAuthenticated) {
    return <LoadingScreen />;
  }

  // Compute access synchronously based on current state
  const hasAccess = (() => {
    if (permission) {
      return hasPermission(permission);
    } else if (permissions && permissions.length > 0) {
      return requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    }
    return true;
  })();

  // Show access denied if user lacks permissions
  if (!hasAccess) {
    return <AccessDenied />;
  }

  // Render children if authorized
  return <>{children}</>;
};

export default ProtectedRoute;
