/**
 * Library exports
 */

// API Client
export { default as api, apiClient, getErrorMessage, getValidationErrors, isHttpError } from './api';
export type { ApiClient } from './api';

// Utilities
export {
  // Date utilities
  formatDate,
  formatRelativeTime,
  formatDateTime,
  parseDate,
  toISOString,
  isDateInRange,
  // String utilities
  getInitials,
  truncate,
  capitalize,
  toTitleCase,
  slugify,
  // Validation helpers
  isValidEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateFileUpload,
  // Misc utilities
  debounce,
  generateId,
  deepClone,
  isEmpty,
  cn,
} from './utils';
