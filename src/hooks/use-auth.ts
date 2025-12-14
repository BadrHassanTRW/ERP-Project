/**
 * useAuth Hook
 * Provides a convenient interface for authentication operations
 * Validates: Requirements 1.5, 2.5 (Loading state management)
 */

'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { LoginFormData, RegisterFormData, User } from '@/types';

/**
 * Return type for the useAuth hook
 */
export interface UseAuthReturn {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  
  // Actions
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

/**
 * Custom hook that wraps the auth store with convenient interface
 * and manages loading states for async operations
 * 
 * Validates: Requirements 1.5, 2.5 (Loading state management)
 * - While login/register request is processing, isLoading is true
 * - Form inputs should be disabled during loading
 * - Submit button should show loading state
 */
export const useAuth = (): UseAuthReturn => {
  // Local loading state for operations initiated from this hook
  const [operationLoading, setOperationLoading] = useState(false);
  
  // Get state and actions from the store
  const {
    user,
    token,
    isAuthenticated,
    isLoading: storeLoading,
    permissions,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuthStore();

  /**
   * Login with loading state management
   * Validates: Requirements 1.5 (Loading state during login)
   */
  const login = useCallback(async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    setOperationLoading(true);
    
    try {
      await storeLogin(data);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(false);
    }
  }, [storeLogin]);

  /**
   * Logout with loading state management
   */
  const logout = useCallback(async (): Promise<void> => {
    setOperationLoading(true);
    
    try {
      await storeLogout();
    } finally {
      setOperationLoading(false);
    }
  }, [storeLogout]);

  /**
   * Register with loading state management
   * Validates: Requirements 2.5 (Loading state during registration)
   */
  const register = useCallback(async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    setOperationLoading(true);
    
    try {
      await storeRegister(data);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(false);
    }
  }, [storeRegister]);

  return {
    // State - combine store loading with operation loading
    user,
    token,
    isAuthenticated,
    isLoading: storeLoading || operationLoading,
    permissions,
    
    // Actions
    login,
    logout,
    register,
    
    // Permission helpers (pass through from store)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default useAuth;
