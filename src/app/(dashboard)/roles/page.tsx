'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Shield, Lock } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/layout/can';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/lib/api';
import type { Role, DataTableColumn, PaginatedResponse } from '@/types';

/**
 * Roles List Page
 * Validates: Requirements 9.1, 9.4
 */
export default function RolesListPage() {
  const router = useRouter();
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  // Data state
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /**
   * Fetch roles from API with pagination
   * Validates: Requirements 9.1
   */
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      const response = await apiClient.get<unknown>('/roles', params);
      const responseData = response.data;
      
      // Handle different response formats
      let rolesArray: Role[] = [];
      
      if (responseData && typeof responseData === 'object') {
        const data = responseData as Record<string, unknown>;
        
        // Check for { roles: [...] } format
        if ('roles' in data && Array.isArray(data.roles)) {
          rolesArray = data.roles as Role[];
        }
        // Check for paginated { data: [...], current_page, ... } format
        else if ('data' in data && Array.isArray(data.data)) {
          rolesArray = data.data as Role[];
          if ('current_page' in data) setCurrentPage(data.current_page as number);
          if ('last_page' in data) setLastPage(data.last_page as number);
          if ('per_page' in data) setPerPage(data.per_page as number);
          if ('total' in data) setTotal(data.total as number);
        }
      } else if (Array.isArray(responseData)) {
        rolesArray = responseData as Role[];
      }
      
      setRoles(rolesArray);
      if (!('total' in (responseData as object))) {
        setTotal(rolesArray.length);
      }
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, showError]);

  // Fetch data on mount and when pagination changes
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Navigate to role detail page
   */
  const handleViewRole = useCallback((role: Role) => {
    router.push(`/roles/${role.id}`);
  }, [router]);

  /**
   * Navigate to edit role page (only for non-system roles)
   * Validates: Requirements 9.4
   */
  const handleEditRole = useCallback((role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.is_system) {
      showError('System roles cannot be edited');
      return;
    }
    router.push(`/roles/${role.id}/edit`);
  }, [router, showError]);

  /**
   * Open delete confirmation dialog (only for non-system roles)
   * Validates: Requirements 9.4
   */
  const handleDeleteClick = useCallback((role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.is_system) {
      showError('System roles cannot be deleted');
      return;
    }
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  }, [showError]);

  /**
   * Confirm role deletion
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!roleToDelete) return;

    setDeleteLoading(true);
    try {
      await apiClient.delete(`/roles/${roleToDelete.id}`);
      showSuccess(`Role "${roleToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }, [roleToDelete, showSuccess, showError, fetchRoles]);

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  }, []);

  /**
   * Navigate to create role page
   */
  const handleCreateRole = useCallback(() => {
    router.push('/roles/create');
  }, [router]);

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
   * Table columns configuration
   * Validates: Requirements 9.1
   */
  const columns: DataTableColumn<Role>[] = [
    {
      key: 'icon',
      header: '',
      width: '50px',
      render: (role) => (
        <div className={`p-2 rounded-lg ${role.is_system ? 'bg-[#DD6B20]/20' : 'bg-[#4A90E2]/20'}`}>
          {role.is_system ? (
            <Lock className="h-4 w-4 text-[#DD6B20]" />
          ) : (
            <Shield className="h-4 w-4 text-[#4A90E2]" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (role) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{role.name}</span>
          {role.is_system && (
            <Badge variant="warning" size="sm">
              System
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (role) => (
        <span className="text-[#A0AEC0]">
          {role.description || <span className="text-[#718096]">No description</span>}
        </span>
      ),
    },
    {
      key: 'users_count',
      header: 'Users',
      width: '100px',
      render: (role) => (
        <Badge variant="info" size="sm">
          {role.users_count ?? 0} users
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '120px',
      render: (role) => formatDate(role.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (role) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewRole(role);
            }}
            className="p-1 text-[#A0AEC0] hover:text-white transition-colors"
            title="View role"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Can permission="roles.edit">
            <button
              onClick={(e) => handleEditRole(role, e)}
              className={`p-1 transition-colors ${
                role.is_system
                  ? 'text-[#718096] cursor-not-allowed'
                  : 'text-[#A0AEC0] hover:text-[#4A90E2]'
              }`}
              title={role.is_system ? 'System roles cannot be edited' : 'Edit role'}
              disabled={role.is_system}
            >
              <Edit className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="roles.delete">
            <button
              onClick={(e) => handleDeleteClick(role, e)}
              className={`p-1 transition-colors ${
                role.is_system
                  ? 'text-[#718096] cursor-not-allowed'
                  : 'text-[#A0AEC0] hover:text-[#E53E3E]'
              }`}
              title={role.is_system ? 'System roles cannot be deleted' : 'Delete role'}
              disabled={role.is_system}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles</h1>
          <p className="text-[#A0AEC0] mt-1">Manage roles and their permissions</p>
        </div>
        {/* Add Role button - permission-gated */}
        <Can permission="roles.create">
          <Button onClick={handleCreateRole}>
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </Can>
      </div>

      {/* Roles table - Validates: Requirements 9.1 */}
      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        onRowClick={handleViewRole}
        emptyMessage="No roles found"
        keyExtractor={(role) => role.id}
      />

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          perPage={perPage}
          total={total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
