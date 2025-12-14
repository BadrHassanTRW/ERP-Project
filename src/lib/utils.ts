/**
 * Utility functions for the ERP Dashboard
 * Validates: Requirements 18.3 (Date handling)
 */

// ============================================
// Date Formatting Utilities
// ============================================

/**
 * Format a date string or Date object to a localized date string
 * @param date - ISO date string or Date object
 * @param format - Date format pattern (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date | null | undefined,
  format: string = 'YYYY-MM-DD'
): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param date - ISO date string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return formatDate(d, 'YYYY-MM-DD');
};

/**
 * Format a date to datetime string
 * @param date - ISO date string or Date object
 * @returns Formatted datetime string
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

/**
 * Parse an ISO date string to a Date object
 * Validates: Requirements 18.3 (Date parsing)
 * @param dateString - ISO date string
 * @returns Date object or null if invalid
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Convert a Date object to ISO string for API requests
 * Validates: Requirements 18.3 (Date serialization)
 * @param date - Date object
 * @returns ISO date string
 */
export const toISOString = (date: Date | null | undefined): string | null => {
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString();
};

/**
 * Check if a date is within a range (inclusive)
 * @param date - Date to check
 * @param from - Start of range
 * @param to - End of range
 * @returns True if date is within range
 */
export const isDateInRange = (
  date: Date | string,
  from: Date | string | null,
  to: Date | string | null
): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return false;
  
  if (from) {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    if (d < fromDate) return false;
  }
  
  if (to) {
    const toDate = typeof to === 'string' ? new Date(to) : to;
    if (d > toDate) return false;
  }
  
  return true;
};

// ============================================
// String Utilities
// ============================================

/**
 * Extract initials from a name (for avatar fallback)
 * @param name - Full name
 * @param maxLength - Maximum number of initials (default: 2)
 * @returns Uppercase initials
 */
export const getInitials = (name: string | null | undefined, maxLength: number = 2): string => {
  if (!name || typeof name !== 'string') return '';
  
  const words = name.trim().split(/\s+/).filter(Boolean);
  
  if (words.length === 0) return '';
  
  const initials = words
    .slice(0, maxLength)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials;
};

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export const truncate = (
  str: string | null | undefined,
  maxLength: number = 50,
  suffix: string = '...'
): string => {
  if (!str || typeof str !== 'string') return '';
  
  if (str.length <= maxLength) return str;
  
  return str.slice(0, maxLength - suffix.length) + suffix;
};


/**
 * Capitalize the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert a string to title case
 * @param str - String to convert
 * @returns Title case string
 */
export const toTitleCase = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate a slug from a string
 * @param str - String to slugify
 * @returns Slugified string
 */
export const slugify = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password meets minimum requirements
 * Validates: Requirements 2.3, 3.4 (Password must be at least 8 characters)
 * @param password - Password string to validate
 * @returns Object with isValid flag and error message
 */
export const validatePassword = (password: string | null | undefined): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'The password must be at least 8 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validate password confirmation matches
 * Validates: Requirements 2.4 (Password confirmation must match)
 * @param password - Password string
 * @param confirmation - Password confirmation string
 * @returns Object with isValid flag and error message
 */
export const validatePasswordConfirmation = (
  password: string | null | undefined,
  confirmation: string | null | undefined
): { isValid: boolean; error?: string } => {
  if (password !== confirmation) {
    return { isValid: false, error: 'The password confirmation does not match' };
  }
  
  return { isValid: true };
};

/**
 * Validate file upload (for logo upload)
 * Validates: Requirements 12.3 (File type and size validation)
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Object with isValid flag and error message
 */
export const validateFileUpload = (
  file: File | null | undefined,
  allowedTypes: string[] = ['image/png', 'image/jpeg', 'image/svg+xml'],
  maxSize: number = 2 * 1024 * 1024 // 2MB default
): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }
  
  return { isValid: true };
};

// ============================================
// Miscellaneous Utilities
// ============================================

/**
 * Debounce a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Generate a unique ID
 * @returns Unique string ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if empty
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Classnames utility for conditional class joining
 * @param classes - Class names or conditional objects
 * @returns Joined class string
 */
export const cn = (...classes: (string | undefined | null | false | Record<string, boolean>)[]): string => {
  return classes
    .flatMap(cls => {
      if (!cls) return [];
      if (typeof cls === 'string') return [cls];
      return Object.entries(cls)
        .filter(([, value]) => value)
        .map(([key]) => key);
    })
    .join(' ');
};
