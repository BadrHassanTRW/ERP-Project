'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { Permission, RoleFormData } from '@/types';

export interface RoleFormProps {
  initialData?: Partial<RoleFormData>;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
  errors?: Record<string, string[]>;
}

/**
 * Group permissions by module
 * Validates: Requirements 9.5
 */
interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

const groupPermissionsByModule = (permissions: Permission[]): PermissionGroup[] => {
  // Ensure permissions is an array
  if (!Array.isArray(permissions)) {
    return [];
  }
  
  const groups: Record<string, Permission[]> = {};
  
  permissions.forEach((permission) => {
    const moduleName = permission.module || 'Other';
    if (!groups[moduleName]) {
      groups[moduleName] = [];
    }
    groups[moduleName].push(permission);
  });

  return Object.entries(groups)
    .map(([moduleName, perms]) => ({ module: moduleName, permissions: perms }))
    .sort((a, b) => a.module.localeCompare(b.module));
};

/**
 * Permission Group Component with expandable section
 */
interface PermissionGroupSectionProps {
  group: PermissionGroup;
  selectedPermissions: number[];
  onTogglePermission: (permissionId: number) => void;
  onToggleAll: (permissionIds: number[], selected: boolean) => void;
  disabled?: boolean;
}

const PermissionGroupSection: React.FC<PermissionGroupSectionProps> = ({
  group,
  selectedPermissions,
  onTogglePermission,
  onToggleAll,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState(true);

  const allSelected = group.permissions.every((p) =>
    selectedPermissions.includes(p.id)
  );
  const someSelected = group.permissions.some((p) =>
    selectedPermissions.includes(p.id)
  );

  const handleToggleAll = () => {
    const permissionIds = group.permissions.map((p) => p.id);
    onToggleAll(permissionIds, !allSelected);
  };

  return (
    <div className="border border-[#4A5568] rounded-lg overflow-hidden">
      {/* Group header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#3B4B63] cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#A0AEC0]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#A0AEC0]" />
          )}
          <span className="font-medium text-white capitalize">{group.module}</span>
          <span className="text-sm text-[#718096]">
            ({group.permissions.length} permissions)
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleAll();
          }}
          disabled={disabled}
          className={`text-sm px-2 py-1 rounded transition-colors ${
            disabled
              ? 'text-[#718096] cursor-not-allowed'
              : allSelected
              ? 'text-[#E53E3E] hover:bg-[#E53E3E]/10'
              : 'text-[#4A90E2] hover:bg-[#4A90E2]/10'
          }`}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Permissions list */}
      {expanded && (
        <div className="p-4 space-y-2 bg-[#2D3748]">
          {group.permissions.map((permission) => {
            const isSelected = selectedPermissions.includes(permission.id);
            return (
              <label
                key={permission.id}
                className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                  disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-[#3B4B63]/50'
                }`}
              >
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onTogglePermission(permission.id)}
                    disabled={disabled}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#4A90E2] border-[#4A90E2]'
                        : 'bg-transparent border-[#4A5568]'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">
                    {permission.name}
                  </div>
                  {permission.description && (
                    <div className="text-xs text-[#718096] mt-0.5">
                      {permission.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Role Form Component
 * Validates: Requirements 9.2, 9.3, 9.5
 */
export const RoleForm: React.FC<RoleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
  errors = {},
}) => {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    initialData?.permissions || []
  );

  // Permissions data
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  /**
   * Fetch available permissions
   * Validates: Requirements 9.5
   */
  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      const response = await apiClient.get<unknown>('/permissions');
      const responseData = response.data;
      
      // Handle different response formats
      let permissionsArray: Permission[] = [];
      
      if (Array.isArray(responseData)) {
        // Direct array
        permissionsArray = responseData as Permission[];
      } else if (responseData && typeof responseData === 'object') {
        const data = responseData as Record<string, unknown>;
        // Check for { permissions: [...] } format
        if ('permissions' in data && Array.isArray(data.permissions)) {
          permissionsArray = data.permissions as Permission[];
        } else if ('data' in data && Array.isArray(data.data)) {
          // Paginated format { data: [...] }
          permissionsArray = data.data as Permission[];
        }
      }
      
      setPermissions(permissionsArray);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedPermissions(initialData.permissions || []);
    }
  }, [initialData]);

  /**
   * Toggle a single permission
   */
  const handleTogglePermission = useCallback((permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  }, []);

  /**
   * Toggle all permissions in a group
   */
  const handleToggleAll = useCallback(
    (permissionIds: number[], selected: boolean) => {
      setSelectedPermissions((prev) => {
        if (selected) {
          // Add all permissions that aren't already selected
          const newIds = permissionIds.filter((id) => !prev.includes(id));
          return [...prev, ...newIds];
        } else {
          // Remove all permissions in the group
          return prev.filter((id) => !permissionIds.includes(id));
        }
      });
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: RoleFormData = {
      name,
      description: description || undefined,
      permissions: selectedPermissions,
    };

    await onSubmit(formData);
  };

  /**
   * Get error message for a field
   */
  const getFieldError = (field: string): string | undefined => {
    const fieldErrors = errors[field];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
  };

  // Group permissions by module
  const permissionGroups = groupPermissionsByModule(permissions);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name field - Validates: Requirements 9.2, 9.3 */}
      <FormField label="Role Name" name="name" required error={getFieldError('name')}>
        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter role name"
          error={!!getFieldError('name')}
          disabled={loading}
          required
        />
      </FormField>

      {/* Description field - Validates: Requirements 9.2, 9.3 */}
      <FormField label="Description" name="description" error={getFieldError('description')}>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter role description (optional)"
          disabled={loading}
          rows={3}
          className="w-full px-3 py-2 bg-[#3B4B63] border border-[#4A5568] rounded-md text-white placeholder:text-[#718096] focus:border-[#6772E5] focus:ring-2 focus:ring-[#6772E5]/20 focus:outline-none transition-all duration-200 resize-none"
        />
      </FormField>

      {/* Permissions grouped by module - Validates: Requirements 9.5 */}
      <FormField label="Permissions" name="permissions" error={getFieldError('permissions')}>
        <div className="space-y-3">
          {permissionsLoading ? (
            <div className="text-center py-8 text-[#A0AEC0]">
              Loading permissions...
            </div>
          ) : permissionGroups.length === 0 ? (
            <div className="text-center py-8 text-[#718096]">
              No permissions available
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-[#A0AEC0] mb-2">
                <span>
                  {selectedPermissions.length} of {permissions.length} permissions selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPermissions.length === permissions.length) {
                      setSelectedPermissions([]);
                    } else {
                      setSelectedPermissions(permissions.map((p) => p.id));
                    }
                  }}
                  disabled={loading}
                  className="text-[#4A90E2] hover:underline disabled:text-[#718096] disabled:no-underline"
                >
                  {selectedPermissions.length === permissions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              {permissionGroups.map((group) => (
                <PermissionGroupSection
                  key={group.module}
                  group={group}
                  selectedPermissions={selectedPermissions}
                  onTogglePermission={handleTogglePermission}
                  onToggleAll={handleToggleAll}
                  disabled={loading}
                />
              ))}
            </>
          )}
        </div>
      </FormField>

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
          {isEdit ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
};

export default RoleForm;
