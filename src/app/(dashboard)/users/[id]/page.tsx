'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Key, UserX, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ToastContainer } from '@/components/ui/toast';
import { Can } from '@/components/layout/can';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/lib/api';
import type { User, AuditLog, DataTableColumn } from '@/types';

/**
 * User Detail Page
 * Validates: Requirements 6.1
 */
export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const { toasts, removeToast, success, error: showError } = useToast();

  // Data state
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(searchParams.get('delete') === 'true');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
      
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      showError(getErrorMessage(err));
      setTimeout(() => {
        router.push('/users');
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [userId, router, showError]);

  /**
   * Fetch recent audit logs for this user
   */
  const fetchAuditLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await apiClient.get<unknown>('/audit-logs', {
        user_id: userId,
        per_page: 10,
      });
      // Handle Laravel's paginated response
      const responseData = response.data;
      if (Array.isArray(responseData)) {
        setAuditLogs(responseData as AuditLog[]);
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        const paginatedData = responseData as { data: AuditLog[] };
        setAuditLogs(Array.isArray(paginatedData.data) ? paginatedData.data : []);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
    fetchAuditLogs();
  }, [fetchUser, fetchAuditLogs]);

  /**
   * Handle user deletion
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    try {
      await apiClient.delete(`/users/${userId}`);
      success('User deleted successfully');
      setTimeout(() => {
        router.push('/users');
      }, 1500);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  }, [userId, router, success, showError]);

  /**
   * Handle user deactivation
   */
  const handleDeactivate = useCallback(async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      await apiClient.put(`/users/${userId}`, {
        ...user,
        is_active: !user.is_active,
        roles: user.roles?.map((r) => r.id) || [],
      });
      success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUser();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setShowDeactivateDialog(false);
    }
  }, [userId, user, success, showError, fetchUser]);

  /**
   * Handle password reset
   */
  const handleResetPassword = useCallback(async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/users/${userId}/reset-password`);
      success('Password reset email sent successfully');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setShowResetPasswordDialog(false);
    }
  }, [userId, success, showError]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get action badge variant
   */
  const getActionBadgeVariant = (action: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'danger';
      case 'login':
        return 'info';
      default:
        return 'default';
    }
  };

  /**
   * Audit log table columns
   */
  const auditLogColumns: DataTableColumn<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (log) => formatDate(log.created_at),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (log) => (
        <span className="capitalize">{log.resource}</span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
    },
  ];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/users')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">User Details</h1>
            <p className="text-[#A0AEC0] mt-1">View and manage user information</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Can permission="users.edit">
            <Button
              variant="secondary"
              onClick={() => router.push(`/users/${userId}/edit`)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Can>
        </div>
      </div>

      {/* User info card */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <div className="flex items-start gap-6">
          <Avatar src={user.avatar} name={user.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-[#A0AEC0] mt-1">{user.email}</p>
            
            {/* Roles */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[#A0AEC0] mb-2">Roles</h3>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge key={role.id} variant="info" size="sm">
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[#718096]">No roles assigned</span>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#718096]">Created:</span>
                <span className="text-[#A0AEC0] ml-2">{formatDate(user.created_at)}</span>
              </div>
              <div>
                <span className="text-[#718096]">Email Verified:</span>
                <span className="text-[#A0AEC0] ml-2">
                  {user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 pt-6 border-t border-[#4A5568] flex flex-wrap gap-3">
          <Can permission="users.edit">
            <Button
              variant="secondary"
              onClick={() => setShowResetPasswordDialog(true)}
            >
              <Key className="h-4 w-4" />
              Reset Password
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeactivateDialog(true)}
            >
              <UserX className="h-4 w-4" />
              {user.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </Can>
          <Can permission="users.delete">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(true)}
              className="text-[#E53E3E] border-[#E53E3E] hover:bg-[#E53E3E]/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </Can>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <DataTable
          columns={auditLogColumns}
          data={auditLogs}
          loading={logsLoading}
          emptyMessage="No recent activity"
          keyExtractor={(log) => log.id}
        />
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />

      {/* Deactivate confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateDialog(false)}
        title={user.is_active ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.name}?`}
        confirmText={user.is_active ? 'Deactivate' : 'Activate'}
        variant="warning"
        loading={actionLoading}
      />

      {/* Reset password confirmation dialog */}
      <ConfirmDialog
        isOpen={showResetPasswordDialog}
        onConfirm={handleResetPassword}
        onCancel={() => setShowResetPasswordDialog(false)}
        title="Reset Password"
        message={`Send a password reset email to ${user.email}?`}
        confirmText="Send Reset Email"
        variant="info"
        loading={actionLoading}
      />
    </div>
  );
}
