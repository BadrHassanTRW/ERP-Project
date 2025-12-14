'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '@/components/forms/user-form';
import { Button } from '@/components/ui/button';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage, getValidationErrors } from '@/lib/api';
import type { User, UserFormData } from '@/types';

/**
 * Create User Page
 * Validates: Requirements 7.1
 */
export default function CreateUserPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  /**
   * Handle form submission
   * Validates: Requirements 7.1
   */
  const handleSubmit = useCallback(async (data: UserFormData) => {
    setLoading(true);
    setValidationErrors({});

    try {
      await apiClient.post<User>('/users', data);
      success('User created successfully');
      
      // Redirect to users list after short delay
      setTimeout(() => {
        router.push('/users');
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
   * Handle cancel - navigate back to users list
   */
  const handleCancel = useCallback(() => {
    router.push('/users');
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
          <h1 className="text-2xl font-bold text-white">Create User</h1>
          <p className="text-[#A0AEC0] mt-1">Add a new user to the system</p>
        </div>
      </div>

      {/* User form */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <UserForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          errors={validationErrors}
        />
      </div>
    </div>
  );
}
