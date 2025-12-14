/**
 * Zustand Auth Store
 * Manages authentication state including user, token, and permissions
 * Validates: Requirements 1.1, 14.1, 14.2, 14.3
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthState, LoginFormData, RegisterFormData } from '@/types';
import { apiClient, getErrorMessage, getValidationErrors, initCsrf } from '@/lib/api';

/**
 * Auth response from login/register API endpoints
 */
interface AuthResponse {
  user: User;
  token: string;
  permissions: string[];
}

/**
 * Extended auth store interface with actions
 */
export interface AuthStore extends AuthState {
  // Actions
  login: (data: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  loadFromStorage: () => void;
  
  // Permission helpers - Validates: Requirements 14.2, 14.3
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

/**
 * Initial state for the auth store
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  permissions: [],
};

/**
 * Zustand auth store with persist middleware
 * Validates: Requirements 1.1 (Bearer token storage in local storage)
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Login action - authenticates user and stores token
       * Validates: Requirements 1.1
       * @param data - Login form data (email, password, remember)
       * @throws Error with message for invalid credentials, unverified email, or lockout
       */
      login: async (data: LoginFormData): Promise<void> => {
        set({ isLoading: true });
        
        try {
          // Initialize CSRF token before login
          await initCsrf();
          
          const response = await apiClient.post<AuthResponse>('/auth/login', data);
          
          // Handle nested data structure from Laravel API
          const responseData = response.data || response;
          const { user, token, permissions = [] } = responseData;
          
          if (!user || !token) {
            throw new Error('Invalid response from server');
          }
          
          set({
            user,
            token,
            permissions,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          
          // Log error for debugging
          console.error('Login error:', error);
          
          // Re-throw with appropriate error message
          // Validates: Requirements 1.2, 1.3, 1.4
          const validationErrors = getValidationErrors(error);
          if (validationErrors) {
            const firstError = Object.values(validationErrors)[0];
            throw new Error(Array.isArray(firstError) ? firstError[0] : String(firstError));
          }
          
          throw new Error(getErrorMessage(error));
        }
      },

      /**
       * Logout action - clears auth state and calls logout endpoint
       */
      logout: async (): Promise<void> => {
        try {
          // Call logout endpoint to invalidate token on server
          await apiClient.post('/auth/logout');
        } catch {
          // Ignore errors - we still want to clear local state
        } finally {
          // Clear all auth state
          set({
            user: null,
            token: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      /**
       * Register action - creates new user account
       * Validates: Requirements 2.1, 2.2, 2.3, 2.4
       * @param data - Registration form data
       * @throws Error with validation messages
       */
      register: async (data: RegisterFormData): Promise<void> => {
        set({ isLoading: true });
        
        try {
          // Initialize CSRF token before registration
          await initCsrf();
          
          await apiClient.post('/auth/register', data);
          
          set({ isLoading: false });
          // Note: After registration, user needs to verify email before logging in
          // So we don't set authenticated state here
        } catch (error) {
          set({ isLoading: false });
          
          // Re-throw with appropriate error message
          const validationErrors = getValidationErrors(error);
          if (validationErrors) {
            const firstError = Object.values(validationErrors)[0];
            throw new Error(Array.isArray(firstError) ? firstError[0] : String(firstError));
          }
          
          throw new Error(getErrorMessage(error));
        }
      },

      /**
       * Set user directly (for profile updates, etc.)
       */
      setUser: (user: User | null): void => {
        set({ 
          user,
          isAuthenticated: user !== null && get().token !== null,
        });
      },

      /**
       * Set token directly
       */
      setToken: (token: string | null): void => {
        set({ 
          token,
          isAuthenticated: token !== null && get().user !== null,
        });
      },

      /**
       * Set loading state
       */
      setLoading: (isLoading: boolean): void => {
        set({ isLoading });
      },

      /**
       * Load auth state from storage (called on app initialization)
       */
      loadFromStorage: (): void => {
        const state = get();
        set({
          isLoading: false,
          isAuthenticated: state.token !== null && state.user !== null,
        });
      },

      /**
       * Check if user has a specific permission
       * Validates: Requirements 14.2, 14.3
       * @param permission - Permission name to check
       * @returns True if user has the permission
       */
      hasPermission: (permission: string): boolean => {
        return get().permissions.includes(permission);
      },

      /**
       * Check if user has any of the specified permissions
       * Validates: Requirements 14.2, 14.3
       * @param permissions - Array of permission names
       * @returns True if user has at least one of the permissions
       */
      hasAnyPermission: (permissions: string[]): boolean => {
        const userPermissions = get().permissions;
        return permissions.some(p => userPermissions.includes(p));
      },

      /**
       * Check if user has all of the specified permissions
       * Validates: Requirements 14.2, 14.3
       * @param permissions - Array of permission names
       * @returns True if user has all of the permissions
       */
      hasAllPermissions: (permissions: string[]): boolean => {
        const userPermissions = get().permissions;
        return permissions.every(p => userPermissions.includes(p));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Persist auth state (token, user, permissions, isAuthenticated)
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
