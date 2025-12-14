'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RoleForm } from '@/components/forms/role-form';
import { Button } from '@/components/ui/button';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage, getValidationErrors } from '@/lib/api';
import type { Role, RoleFormData } from '@/types';

/**
 * Create Role Page
 * Validates: Requirements 9.2
 */
export default function CreateRolePage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  /**
   * Handle form submission
   * Validates: Requirements 9.2
   */
  const handleSubmit = useCallback(async (data: RoleFormData) => {
    setLoading(true);
    setValidationErrors({});

    try {
      // Create the role
      const response = await apiClient.post<unknown>('/roles', {
        name: data.name,
        description: data.description,
      });

      // Extract role ID from response - handle { role: { id } } or { id } format
      const responseData = response.data as Record<string, unknown>;
      const role = (responseData.role || responseData) as { id: number };
      const roleId = role.id;

      // Assign permissions to the role if any selected
      if (data.permissions.length > 0 && roleId) {
        await apiClient.post(`/roles/${roleId}/permissions`, {
          permissions: data.permissions,
        });
      }

      success('Role created successfully');
      
      // Redirect to roles list after short delay
      setTimeout(() => {
        router.push('/roles');
      }, 1500);
    } catch (err) {
      const errors = getValidationErrors(err);
      if (errors) {
        setValidationErrors(errors);
      } else {
        showError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [router, success, showError]);

  /**
   * Handle cancel - navigate back to roles list
   */
  const handleCancel = useCallback(() => {
    router.push('/roles');
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={handleCancel}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Role</h1>
          <p className="text-[#A0AEC0] mt-1">Add a new role to the system</p>
        </div>
      </div>

      {/* Role form */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <RoleForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          errors={validationErrors}
        />
      </div>
    </div>
  );
}
