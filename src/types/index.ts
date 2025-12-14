// Core Entity Types

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  users_count?: number;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
  updated_at: string;
}

// Grouped permissions by module
export interface GroupedPermissions {
  [module: string]: Permission[];
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource: string;
  resource_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: User;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string | null;
  type: 'string' | 'integer' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}


// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error_code?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Auth State Types

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}

// Form Data Types

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  roles: number[];
  role_ids?: number[]; // Laravel expects role_ids
  is_active: boolean;
  send_welcome_email?: boolean;
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissions: number[];
}

export interface ProfileFormData {
  name: string;
  email: string;
}

export interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface SettingsFormData {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  timezone: string;
  date_format: string;
  currency: string;
  currency_symbol_position: string;
  items_per_page: number;
  session_timeout: number;
  allow_registration: boolean;
  require_email_verification: boolean;
}

// UI Component Types

export interface NavItem {
  label: string;
  icon: string;
  href: string;
  permission: string | null;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface PaginationProps {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Audit Log Action Types

export type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete';

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  login: 'blue',
  logout: 'gray',
  create: 'green',
  update: 'yellow',
  delete: 'red',
};

// Alert/Badge Types

export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export const ALERT_COLORS: Record<AlertType, string> = {
  success: '#38A169',
  error: '#E53E3E',
  warning: '#DD6B20',
  info: '#3182CE',
};

// File Upload Types

export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
}

export const LOGO_UPLOAD_CONFIG: FileUploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
};
