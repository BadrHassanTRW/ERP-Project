'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { Role, UserFormData } from '@/types';

export interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
  errors?: Record<string, string[]>;
}

/**
 * User Form Component
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
  errors = {},
}) => {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<(string | number)[]>(
    initialData?.roles?.map(String) || []
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Roles data
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  /**
   * Fetch available roles for the multi-select
   * Validates: Requirements 7.3
   */
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const response = await apiClient.get<unknown>('/roles');
      const responseData = response.data;
      
      // Handle different response formats
      let rolesArray: Role[] = [];
      
      if (Array.isArray(responseData)) {
        rolesArray = responseData as Role[];
      } else if (responseData && typeof responseData === 'object') {
        const data = responseData as Record<string, unknown>;
        // Check for { roles: [...] } format
        if ('roles' in data && Array.isArray(data.roles)) {
          rolesArray = data.roles as Role[];
        }
        // Check for { data: [...] } format
        else if ('data' in data && Array.isArray(data.data)) {
          rolesArray = data.data as Role[];
        }
      }
      
      setRoles(rolesArray);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setSelectedRoles(initialData.roles?.map(String) || []);
      setIsActive(initialData.is_active ?? true);
    }
  }, [initialData]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Laravel expects role_ids, not roles
    const formData: UserFormData = {
      name,
      email,
      roles: selectedRoles.map(Number),
      role_ids: selectedRoles.map(Number),
      is_active: isActive,
    };

    // Include password fields only if provided
    if (password) {
      formData.password = password;
      formData.password_confirmation = passwordConfirmation;
    }

    // Include send_welcome_email only for create mode
    if (!isEdit) {
      formData.send_welcome_email = sendWelcomeEmail;
    }

    await onSubmit(formData);
  };

  /**
   * Get error message for a field
   */
  const getFieldError = (field: string): string | undefined => {
    const fieldErrors = errors[field];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
  };

  // Convert roles to MultiSelect options
  const roleOptions: MultiSelectOption[] = roles.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name field - Validates: Requirements 7.1, 7.2 */}
      <FormField label="Name" name="name" required error={getFieldError('name')}>
        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter user name"
          error={!!getFieldError('name')}
          disabled={loading}
          required
        />
      </FormField>

      {/* Email field - Validates: Requirements 7.1, 7.2 */}
      <FormField label="Email" name="email" required error={getFieldError('email')}>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          error={!!getFieldError('email')}
          disabled={loading}
          required
        />
      </FormField>

      {/* Password field - Validates: Requirements 7.1, 7.2 */}
      <FormField
        label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
        name="password"
        required={!isEdit}
        error={getFieldError('password')}
      >
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? 'Enter new password' : 'Enter password'}
          error={!!getFieldError('password')}
          disabled={loading}
          required={!isEdit}
        />
      </FormField>

      {/* Password confirmation field */}
      <FormField
        label="Confirm Password"
        name="password_confirmation"
        required={!isEdit && !!password}
        error={getFieldError('password_confirmation')}
      >
        <Input
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          placeholder="Confirm password"
          error={!!getFieldError('password_confirmation')}
          disabled={loading}
          required={!isEdit && !!password}
        />
      </FormField>

      {/* Roles multi-select - Validates: Requirements 7.3 */}
      <FormField label="Roles" name="roles" error={getFieldError('roles')}>
        <MultiSelect
          options={roleOptions}
          value={selectedRoles}
          onChange={setSelectedRoles}
          placeholder={rolesLoading ? 'Loading roles...' : 'Select roles...'}
          disabled={loading || rolesLoading}
        />
      </FormField>

      {/* Status toggle - Validates: Requirements 7.4 */}
      <FormField label="Status" name="is_active">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#4A5568] rounded-full peer peer-checked:bg-[#38A169] transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          <span className="text-[#A0AEC0]">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </label>
      </FormField>

      {/* Send welcome email checkbox - only for create mode - Validates: Requirements 7.1 */}
      {!isEdit && (
        <FormField label="" name="send_welcome_email">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWelcomeEmail}
              onChange={(e) => setSendWelcomeEmail(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded border-[#4A5568] bg-[#3B4B63] text-[#4A90E2] focus:ring-[#6772E5] focus:ring-2"
            />
            <span className="text-[#A0AEC0]">Send welcome email to user</span>
          </label>
        </FormField>
      )}

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#4A5568]">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
