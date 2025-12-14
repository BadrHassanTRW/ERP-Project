import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types';

// Base URL configuration - can be overridden via environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Create Axios instance with default configuration
// Using stateless token-based auth (no CSRF required)
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * CSRF initialization (no-op for token-based auth)
 * Kept for API compatibility
 */
export const initCsrf = async (): Promise<void> => {
  // No CSRF needed for stateless token-based authentication
  return;
};

/**
 * Get token from localStorage (client-side only)
 */
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Clear auth state and redirect to login
 * Only redirect if not already on login page to prevent loops
 */
const handleUnauthorized = (): void => {
  if (typeof window === 'undefined') return;
  
  // Don't redirect if already on auth pages
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/login') || 
      currentPath.startsWith('/register') || 
      currentPath.startsWith('/forgot-password') ||
      currentPath.startsWith('/reset-password')) {
    return;
  }
  
  localStorage.removeItem('auth-storage');
  window.location.href = '/login';
};

/**
 * Request interceptor - Injects Bearer token into requests
 * Validates: Requirements 14.4 (Bearer token injection)
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


/**
 * Response interceptor - Handles error responses
 * Validates: Requirements 14.4, 14.5, 17.2, 17.3, 17.4
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    switch (status) {
      case 401:
        // Unauthorized - clear session and redirect to login
        // Validates: Requirements 14.4
        handleUnauthorized();
        break;
      case 403:
        // Forbidden - user lacks permission
        // Validates: Requirements 14.5
        // Let calling code handle the display of access denied message
        break;
      case 422:
        // Validation errors - let calling code handle field-specific errors
        // Validates: Requirements 17.2
        break;
      case 429:
        // Rate limiting
        // Validates: Requirements 17.4
        break;
      case 500:
        // Server error
        // Validates: Requirements 17.3
        break;
      default:
        // Other errors - let calling code handle
        break;
    }

    return Promise.reject(error);
  }
);

/**
 * API Client interface for type-safe API calls
 */
export interface ApiClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: unknown): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: unknown): Promise<ApiResponse<T>>;
  delete<T>(url: string): Promise<ApiResponse<T>>;
  upload<T>(url: string, file: File, fieldName?: string): Promise<ApiResponse<T>>;
}

/**
 * Unwrap Laravel API response
 * Laravel returns: { success: true, data: T } or { success: true, data: { data: T[], current_page, ... } }
 * This function extracts the actual data
 */
const unwrapResponse = <T>(responseData: unknown): T => {
  // If response has success and data properties (Laravel format)
  if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
    return (responseData as { success: boolean; data: T }).data;
  }
  // Return as-is if not wrapped
  return responseData as T;
};

/**
 * Type-safe API client wrapper
 * Automatically unwraps Laravel's { success, data } response format
 */
export const apiClient: ApiClient = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await api.get(url, { params });
    const unwrapped = unwrapResponse<T>(response.data);
    return { success: true, data: unwrapped };
  },

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await api.post(url, data);
    const unwrapped = unwrapResponse<T>(response.data);
    return { success: true, data: unwrapped };
  },

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await api.put(url, data);
    const unwrapped = unwrapResponse<T>(response.data);
    return { success: true, data: unwrapped };
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await api.delete(url);
    const unwrapped = unwrapResponse<T>(response.data);
    return { success: true, data: unwrapped };
  },

  async upload<T>(url: string, file: File, fieldName = 'file'): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const unwrapped = unwrapResponse<T>(response.data);
    return { success: true, data: unwrapped };
  },
};

/**
 * Helper to extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Check for validation errors
    if (axiosError.response?.status === 422 && axiosError.response?.data?.errors) {
      const errors = axiosError.response.data.errors;
      const firstError = Object.values(errors)[0];
      return Array.isArray(firstError) ? firstError[0] : String(firstError);
    }
    
    // Check for message in response
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    // Status-specific messages
    switch (axiosError.response?.status) {
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'Access Denied: You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Something went wrong. Please try again.';
      default:
        return axiosError.message || 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred.';
};

/**
 * Helper to extract validation errors from API error response
 */
export const getValidationErrors = (error: unknown): Record<string, string[]> | null => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.status === 422 && axiosError.response?.data?.errors) {
      return axiosError.response.data.errors;
    }
  }
  return null;
};

/**
 * Check if error is a specific HTTP status
 */
export const isHttpError = (error: unknown, status: number): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === status;
  }
  return false;
};

export default api;
