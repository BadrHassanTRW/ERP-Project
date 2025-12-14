'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, Building2, Globe, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { FileUpload } from '@/components/ui/file-upload';
import { ToastContainer } from '@/components/ui/toast';
import { Can } from '@/components/layout/can';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage, getValidationErrors } from '@/lib/api';
import type { SystemSetting, SettingsFormData, LOGO_UPLOAD_CONFIG } from '@/types';

/**
 * Settings card wrapper component
 */
interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, icon, children }) => (
  <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-[#3B4B63] rounded-lg">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-[#A0AEC0]">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

/**
 * Toggle switch component
 */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      ${checked ? 'bg-[#4A90E2]' : 'bg-[#4A5568]'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);

/**
 * Select component for dropdowns
 */
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  error?: boolean;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, disabled = false, error = false }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`
      w-full px-3 py-2 bg-[#3B4B63] border rounded-md
      text-white focus:ring-2 focus:ring-[#6772E5]/20 focus:outline-none
      transition-all duration-200
      ${error ? 'border-[#E53E3E] focus:border-[#E53E3E]' : 'border-[#4A5568] focus:border-[#6772E5]'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// Logo upload configuration
const logoUploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
};

// Timezone options
const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

// Date format options
const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-14)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (14/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/14/2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (14-12-2024)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 14, 2024)' },
];

// Currency options
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
];

// Currency position options
const currencyPositionOptions = [
  { value: 'before', label: 'Before amount ($100)' },
  { value: 'after', label: 'After amount (100$)' },
];

// Items per page options
const itemsPerPageOptions = [
  { value: '10', label: '10 items' },
  { value: '25', label: '25 items' },
  { value: '50', label: '50 items' },
  { value: '100', label: '100 items' },
];

// Session timeout options (in minutes)
const sessionTimeoutOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '480', label: '8 hours' },
  { value: '1440', label: '24 hours' },
];

// Default form values
const defaultFormData: SettingsFormData = {
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  timezone: 'UTC',
  date_format: 'YYYY-MM-DD',
  currency: 'USD',
  currency_symbol_position: 'before',
  items_per_page: 10,
  session_timeout: 60,
  allow_registration: true,
  require_email_verification: true,
};

/**
 * System Settings Page
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */
export default function SettingsPage() {
  const { toasts, removeToast, success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<SettingsFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [deletingLogo, setDeletingLogo] = useState(false);

  /**
   * Fetch current settings from API
   * Validates: Requirements 12.1
   */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<unknown>('/settings');
      
      // Handle different response formats
      let settings: SystemSetting[] = [];
      if (Array.isArray(response.data)) {
        settings = response.data as SystemSetting[];
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with settings array inside
        const data = response.data as Record<string, unknown>;
        if ('settings' in data && Array.isArray(data.settings)) {
          settings = data.settings as SystemSetting[];
        } else if ('data' in data && Array.isArray(data.data)) {
          settings = data.data as SystemSetting[];
        }
      }

      // Convert settings array to form data object
      const newFormData = { ...defaultFormData };
      settings.forEach((setting) => {
        const key = setting.key as keyof SettingsFormData;
        if (key in newFormData) {
          if (setting.type === 'boolean') {
            (newFormData as Record<string, unknown>)[key] = setting.value === 'true' || setting.value === '1';
          } else if (setting.type === 'integer') {
            (newFormData as Record<string, unknown>)[key] = parseInt(setting.value || '0', 10);
          } else {
            (newFormData as Record<string, unknown>)[key] = setting.value || '';
          }
        }
        // Handle logo URL separately
        if (setting.key === 'company_logo' && setting.value) {
          setLogoUrl(setting.value);
        }
      });

      setFormData(newFormData);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Handle form field changes
   */
  const handleChange = (field: keyof SettingsFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle logo file selection
   * Validates: Requirements 12.3
   */
  const handleLogoSelect = (file: File | null) => {
    setLogoFile(file);
  };

  /**
   * Upload logo to server
   * Validates: Requirements 12.3
   */
  const uploadLogo = async (): Promise<boolean> => {
    if (!logoFile) return true;

    try {
      const response = await apiClient.upload<{ url: string }>('/settings/logo', logoFile, 'logo');
      setLogoUrl(response.data.url);
      setLogoFile(null);
      return true;
    } catch (err) {
      showError(getErrorMessage(err));
      return false;
    }
  };

  /**
   * Delete logo from server
   * Validates: Requirements 12.4
   */
  const handleDeleteLogo = async () => {
    if (!logoUrl) return;

    setDeletingLogo(true);
    try {
      await apiClient.delete('/settings/logo');
      setLogoUrl(null);
      success('Logo deleted successfully');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeletingLogo(false);
    }
  };

  /**
   * Save all settings
   * Validates: Requirements 12.2, 12.5
   */
  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      // Upload logo first if there's a new file
      if (logoFile) {
        const logoUploaded = await uploadLogo();
        if (!logoUploaded) {
          setSaving(false);
          return;
        }
      }

      // Save settings
      await apiClient.put('/settings', formData);
      success('Settings saved successfully');
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      if (validationErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          fieldErrors[field] = messages[0];
        });
        setErrors(fieldErrors);
      } else {
        showError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-[#A0AEC0] mt-1">Configure system settings</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-[#A0AEC0] mt-1">Configure system settings</p>
        </div>
        <Can permission="settings.edit">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </Can>
      </div>

      {/* Company Information Card - Validates: Requirements 12.1, 12.3, 12.4 */}
      <SettingsCard
        title="Company Information"
        description="Basic information about your company"
        icon={<Building2 className="h-5 w-5 text-[#4A90E2]" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField label="Company Logo" name="company_logo">
              <div className="flex items-start gap-4">
                <FileUpload
                  onFileSelect={handleLogoSelect}
                  config={logoUploadConfig}
                  currentPreview={logoUrl}
                  className="flex-1"
                />
                {logoUrl && !logoFile && (
                  <Can permission="settings.edit">
                    <Button
                      variant="secondary"
                      onClick={handleDeleteLogo}
                      loading={deletingLogo}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </Can>
                )}
              </div>
            </FormField>
          </div>

          <FormField label="Company Name" name="company_name" error={errors.company_name} required>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Enter company name"
              error={!!errors.company_name}
            />
          </FormField>

          <FormField label="Company Email" name="company_email" error={errors.company_email} required>
            <Input
              id="company_email"
              type="email"
              value={formData.company_email}
              onChange={(e) => handleChange('company_email', e.target.value)}
              placeholder="contact@company.com"
              error={!!errors.company_email}
            />
          </FormField>

          <FormField label="Company Phone" name="company_phone" error={errors.company_phone}>
            <Input
              id="company_phone"
              value={formData.company_phone}
              onChange={(e) => handleChange('company_phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              error={!!errors.company_phone}
            />
          </FormField>

          <FormField label="Company Address" name="company_address" error={errors.company_address}>
            <Input
              id="company_address"
              value={formData.company_address}
              onChange={(e) => handleChange('company_address', e.target.value)}
              placeholder="123 Business St, City, Country"
              error={!!errors.company_address}
            />
          </FormField>
        </div>
      </SettingsCard>

      {/* Regional Settings Card - Validates: Requirements 12.1 */}
      <SettingsCard
        title="Regional Settings"
        description="Configure timezone, date format, and currency"
        icon={<Globe className="h-5 w-5 text-[#4ECDC4]" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Timezone" name="timezone" error={errors.timezone} required>
            <Select
              value={formData.timezone}
              onChange={(value) => handleChange('timezone', value)}
              options={timezoneOptions}
              error={!!errors.timezone}
            />
          </FormField>

          <FormField label="Date Format" name="date_format" error={errors.date_format} required>
            <Select
              value={formData.date_format}
              onChange={(value) => handleChange('date_format', value)}
              options={dateFormatOptions}
              error={!!errors.date_format}
            />
          </FormField>

          <FormField label="Currency" name="currency" error={errors.currency} required>
            <Select
              value={formData.currency}
              onChange={(value) => handleChange('currency', value)}
              options={currencyOptions}
              error={!!errors.currency}
            />
          </FormField>

          <FormField label="Currency Position" name="currency_symbol_position" error={errors.currency_symbol_position}>
            <Select
              value={formData.currency_symbol_position}
              onChange={(value) => handleChange('currency_symbol_position', value)}
              options={currencyPositionOptions}
              error={!!errors.currency_symbol_position}
            />
          </FormField>
        </div>
      </SettingsCard>

      {/* System Settings Card - Validates: Requirements 12.1 */}
      <SettingsCard
        title="System Settings"
        description="Configure system behavior and defaults"
        icon={<SettingsIcon className="h-5 w-5 text-[#DD6B20]" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Items Per Page" name="items_per_page" error={errors.items_per_page}>
            <Select
              value={String(formData.items_per_page)}
              onChange={(value) => handleChange('items_per_page', parseInt(value, 10))}
              options={itemsPerPageOptions}
              error={!!errors.items_per_page}
            />
          </FormField>

          <FormField label="Session Timeout" name="session_timeout" error={errors.session_timeout}>
            <Select
              value={String(formData.session_timeout)}
              onChange={(value) => handleChange('session_timeout', parseInt(value, 10))}
              options={sessionTimeoutOptions}
              error={!!errors.session_timeout}
            />
          </FormField>

          <div className="flex items-center justify-between p-4 bg-[#3B4B63] rounded-lg">
            <div>
              <p className="text-white font-medium">Allow Registration</p>
              <p className="text-sm text-[#A0AEC0]">Enable new user registration</p>
            </div>
            <ToggleSwitch
              checked={formData.allow_registration}
              onChange={(checked) => handleChange('allow_registration', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#3B4B63] rounded-lg">
            <div>
              <p className="text-white font-medium">Require Email Verification</p>
              <p className="text-sm text-[#A0AEC0]">Users must verify email before login</p>
            </div>
            <ToggleSwitch
              checked={formData.require_email_verification}
              onChange={(checked) => handleChange('require_email_verification', checked)}
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
