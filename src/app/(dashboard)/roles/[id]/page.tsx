'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Shield, Lock, Loader2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ToastContainer } from '@/components/ui/toast';
import { Can } from '@/components/layout/can';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/lib/api';
import type { Role, User, Permission, DataTableColumn } from '@/types';

/**
 * Group permissions by module for display
 */
interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

const groupPermissionsByModule = (permissions: Permission[]): PermissionGroup[] => {
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
 * Permission Group Display Component
 */
interface PermissionGroupDisplayProps {
  group: PermissionGroup;
}

const PermissionGroupDisplay: React.FC<PermissionGroupDisplayProps> = ({ group }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-[#4A5568] rounded-lg overflow-hidden">
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
          <Badge variant="info" size="sm">
            {group.permissions.length}
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-[#2D3748]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {group.permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center gap-2 p-2 rounded bg-[#3B4B63]/50"
              >
                <Shield className="h-4 w-4 text-[#4A90E2] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{permission.name}</div>
                  {permission.description && (
                    <div className="text-xs text-[#718096] truncate">
                      {permission.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Role Detail Page
 * Validates: Requirements 9.1
 */
export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { toasts, removeToast, success, error: showError } = useToast();

  // Data state
  const [role, setRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Fetch role data
   */
  const fetchRole = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Role>(`/roles/${roleId}`);
      setRole(response.data);
    } catch (err) {
      showError(getErrorMessage(err));
      setTimeout(() => {
        router.push('/roles');
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [roleId, router, showError]);

  /**
   * Fetch users with this role
   */
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.get<User[]>('/users', {
        role_id: roleId,
        per_page: 10,
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    fetchRole();
    fetchUsers();
  }, [fetchRole, fetchUsers]);

  /**
   * Handle role deletion
   * Validates: Requirements 9.4
   */
  const handleDelete = useCallback(async () => {
    if (role?.is_system) {
      showError('System roles cannot be deleted');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.delete(`/roles/${roleId}`);
      success('Role deleted successfully');
      setTimeout(() => {
        router.push('/roles');
      }, 1500);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  }, [roleId, role, router, success, showError]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Users table columns
   */
  const userColumns: DataTableColumn<User>[] = [
    {
      key: 'avatar',
      header: '',
      width: '50px',
      render: (user) => <Avatar src={user.avatar} name={user.name} size="sm" />,
    },
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <span className="font-medium text-white">{user.name}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Group permissions by module
  const permissionGroups = role?.permissions
    ? groupPermissionsByModule(role.permissions)
    : [];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A90E2]" />
      </div>
    );
  }

  // Role not found
  if (!role) {
    return (
      <div className="text-center py-12">
        <p className="text-[#A0AEC0]">Role not found</p>
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
            onClick={() => router.push('/roles')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Role Details</h1>
            <p className="text-[#A0AEC0] mt-1">View role information and permissions</p>
          </div>
        </div>
        
        {/* Action buttons - disabled for system roles */}
        <div className="flex items-center gap-2">
          <Can permission="roles.edit">
            <Button
              variant="secondary"
              onClick={() => router.push(`/roles/${roleId}/edit`)}
              disabled={role.is_system}
              title={role.is_system ? 'System roles cannot be edited' : 'Edit role'}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Can>
          <Can permission="roles.delete">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(true)}
              disabled={role.is_system}
              className={role.is_system ? '' : 'text-[#E53E3E] border-[#E53E3E] hover:bg-[#E53E3E]/10'}
              title={role.is_system ? 'System roles cannot be deleted' : 'Delete role'}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </Can>
        </div>
      </div>

      {/* Role info card */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <div className="flex items-start gap-6">
          <div className={`p-4 rounded-lg ${role.is_system ? 'bg-[#DD6B20]/20' : 'bg-[#4A90E2]/20'}`}>
            {role.is_system ? (
              <Lock className="h-8 w-8 text-[#DD6B20]" />
            ) : (
              <Shield className="h-8 w-8 text-[#4A90E2]" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">{role.name}</h2>
              {role.is_system && (
                <Badge variant="warning" size="sm">
                  System Role
                </Badge>
              )}
            </div>
            <p className="text-[#A0AEC0] mt-1">
              {role.description || 'No description provided'}
            </p>
            
            {/* Meta info */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#718096]">Created:</span>
                <span className="text-[#A0AEC0] ml-2">{formatDate(role.created_at)}</span>
              </div>
              <div>
                <span className="text-[#718096]">Users:</span>
                <span className="text-[#A0AEC0] ml-2">{role.users_count ?? users.length} users</span>
              </div>
              <div>
                <span className="text-[#718096]">Permissions:</span>
                <span className="text-[#A0AEC0] ml-2">{role.permissions?.length ?? 0} permissions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions section */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-[#4A90E2]" />
          <h2 className="text-lg font-semibold text-white">Assigned Permissions</h2>
        </div>
        
        {permissionGroups.length === 0 ? (
          <div className="text-center py-8 text-[#718096]">
            No permissions assigned to this role
          </div>
        ) : (
          <div className="space-y-3">
            {permissionGroups.map((group) => (
              <PermissionGroupDisplay key={group.module} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Users with this role */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-[#4A90E2]" />
          <h2 className="text-lg font-semibold text-white">Users with this Role</h2>
        </div>
        <DataTable
          columns={userColumns}
          data={users}
          loading={usersLoading}
          onRowClick={(user) => router.push(`/users/${user.id}`)}
          emptyMessage="No users assigned to this role"
          keyExtractor={(user) => user.id}
        />
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${role.name}"? This action cannot be undone. Users with this role will lose these permissions.`}
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
