'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { UserForm } from '@/components/forms/user-form';
import { Button } from '@/components/ui/button';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage, getValidationErrors } from '@/lib/api';
import type { User, UserFormData } from '@/types';

/**
 * Edit User Page
 * Validates: Requirements 7.2
 */
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { toasts, removeToast, success, error: showError } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  /**
   * Fetch user data
   */
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<unknown>(`/users/${userId}`);
      // Handle both direct user object and nested { user: {...} } format
      const responseData = response.data as Record<string, unknown>;
      let userData: User | null = null;
      
      if (responseData && typeof responseData === 'object') {
        // Check for { user: {...} } format
        if ('user' in responseData && responseData.user) {
          userData = responseData.user as User;
        } else if ('id' in responseData) {
          // Direct user object
          userData = responseData as unknown as User;
        }
      }
      
      setUser(userData);
    } catch (err) {
      showError(getErrorMessage(err));
      // Redirect to users list if user not found
      setTimeout(() => {
        router.push('/users');
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [userId, router, showError]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Handle form submission
   * Validates: Requirements 7.2
   */
  const handleSubmit = useCallback(async (data: UserFormData) => {
    setSubmitting(true);
    setValidationErrors({});

    try {
      await apiClient.put<User>(`/users/${userId}`, data);
      success('User updated successfully');
      
      // Redirect to user detail page after short delay
      setTimeout(() => {
        router.push(`/users/${userId}`);
      }, 1500);
    } catch (err) {
      const errors = getValidationErrors(err);
      if (errors) {
        setValidationErrors(errors);
      } else {
        showError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }, [userId, router, success, showError]);

  /**
   * Handle cancel - navigate back to user detail page
   */
  const handleCancel = useCallback(() => {
    router.push(`/users/${userId}`);
  }, [router, userId]);

  /**
   * Convert user data to form initial data
   */
  const getInitialData = (): Partial<UserFormData> | undefined => {
    if (!user) return undefined;
    return {
      name: user.name,
      email: user.email,
      roles: user.roles?.map((role) => role.id) || [],
      is_active: user.is_active,
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A90E2]" />
      </div>
    );
  }

  // User not found
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-[#A0AEC0]">User not found</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Edit User</h1>
          <p className="text-[#A0AEC0] mt-1">Update user information for {user.name}</p>
        </div>
      </div>

      {/* User form */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <UserForm
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit
          loading={submitting}
          errors={validationErrors}
        />
      </div>
    </div>
  );
}
