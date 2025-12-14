'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/layout/can';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/lib/api';
import type { User, Role, DataTableColumn, PaginatedResponse } from '@/types';

/**
 * Filter select component for status and role filtering
 */
interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`
      px-3 py-2 bg-[#3B4B63] border border-[#4A5568] rounded-md
      text-[#FFFFFF] focus:border-[#6772E5] focus:ring-2 focus:ring-[#6772E5]/20 focus:outline-none
      transition-all duration-200 ${className}
    `}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

/**
 * Users List Page
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export default function UsersListPage() {
  const router = useRouter();
  const { toasts, removeToast, error: showError } = useToast();

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  /**
   * Fetch users from API with filters and pagination
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      // Add search filter - Validates: Requirements 6.2
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add status filter - Validates: Requirements 6.3
      if (statusFilter) {
        params.is_active = statusFilter === 'active';
      }

      // Add role filter - Validates: Requirements 6.4
      if (roleFilter) {
        params.role_id = roleFilter;
      }

      const response = await apiClient.get<unknown>('/users', params);
      
      // Handle Laravel's paginated response format
      // Laravel returns: { current_page, data: [...], last_page, per_page, total, ... }
      const paginatedData = response.data as {
        current_page: number;
        data: User[];
        last_page: number;
        per_page: number;
        total: number;
      };
      
      if (paginatedData && Array.isArray(paginatedData.data)) {
        setUsers(paginatedData.data);
        setCurrentPage(paginatedData.current_page);
        setLastPage(paginatedData.last_page);
        setPerPage(paginatedData.per_page);
        setTotal(paginatedData.total);
      } else if (Array.isArray(paginatedData)) {
        // Fallback for non-paginated response
        setUsers(paginatedData as unknown as User[]);
        setTotal((paginatedData as unknown as User[]).length);
      }
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, statusFilter, roleFilter, showError]);

  /**
   * Fetch roles for the role filter dropdown
   */
  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiClient.get<unknown>('/roles');
      const rolesData = response.data;
      
      // Handle different response formats
      let rolesArray: Role[] = [];
      
      if (Array.isArray(rolesData)) {
        rolesArray = rolesData as Role[];
      } else if (rolesData && typeof rolesData === 'object') {
        const data = rolesData as Record<string, unknown>;
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
      // Silently fail - roles filter is optional
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  /**
   * Handle search input change with debounce
   * Validates: Requirements 6.2
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  /**
   * Handle page change
   * Validates: Requirements 6.5
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Navigate to user detail page
   */
  const handleViewUser = useCallback((user: User) => {
    router.push(`/users/${user.id}`);
  }, [router]);

  /**
   * Navigate to edit user page
   */
  const handleEditUser = useCallback((user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/users/${user.id}/edit`);
  }, [router]);

  /**
   * Navigate to create user page
   * Validates: Requirements 6.6
   */
  const handleCreateUser = useCallback(() => {
    router.push('/users/create');
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
   * Validates: Requirements 6.1
   */
  const columns: DataTableColumn<User>[] = [
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
      key: 'roles',
      header: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((role) => (
              <Badge key={role.id} variant="info" size="sm">
                {role.name}
              </Badge>
            ))
          ) : (
            <span className="text-[#718096]">No roles</span>
          )}
        </div>
      ),
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
    {
      key: 'created_at',
      header: 'Created',
      render: (user) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewUser(user);
            }}
            className="p-1 text-[#A0AEC0] hover:text-white transition-colors"
            title="View user"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Can permission="users.edit">
            <button
              onClick={(e) => handleEditUser(user, e)}
              className="p-1 text-[#A0AEC0] hover:text-[#4A90E2] transition-colors"
              title="Edit user"
            >
              <Edit className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="users.delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/users/${user.id}?delete=true`);
              }}
              className="p-1 text-[#A0AEC0] hover:text-[#E53E3E] transition-colors"
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  // Status filter options - Validates: Requirements 6.3
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Role filter options - Validates: Requirements 6.4
  const roleOptions = roles.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-[#A0AEC0] mt-1">Manage user accounts and permissions</p>
        </div>
        {/* Add User button - permission-gated - Validates: Requirements 6.6 */}
        <Can permission="users.create">
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Can>
      </div>

      {/* Filters - Validates: Requirements 6.2, 6.3, 6.4 */}
      <div className="flex flex-wrap gap-4">
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="All Statuses"
          className="w-full sm:w-40"
        />
        <FilterSelect
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleOptions}
          placeholder="All Roles"
          className="w-full sm:w-40"
        />
      </div>

      {/* Users table - Validates: Requirements 6.1 */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={handleViewUser}
        emptyMessage="No users found"
        keyExtractor={(user) => user.id}
      />

      {/* Pagination - Validates: Requirements 6.5 */}
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
