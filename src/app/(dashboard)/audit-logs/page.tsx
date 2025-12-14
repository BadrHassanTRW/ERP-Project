'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { DateRangePicker, DateRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/lib/api';
import type { AuditLog, User, DataTableColumn, PaginatedResponse, BadgeVariant } from '@/types';

/**
 * Filter select component for dropdown filters
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
 * Get badge variant based on action type
 * Validates: Requirements 11.6 - Color-code action badges
 * login=blue, logout=gray, create=green, update=yellow, delete=red
 */
const getActionBadgeVariant = (action: string): BadgeVariant => {
  switch (action.toLowerCase()) {
    case 'login':
      return 'info'; // blue
    case 'logout':
      return 'default'; // gray
    case 'create':
      return 'success'; // green
    case 'update':
      return 'warning'; // yellow
    case 'delete':
      return 'danger'; // red
    default:
      return 'default';
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Expandable row component for showing old/new values and user agent
 * Validates: Requirements 11.5
 */
interface ExpandedRowProps {
  log: AuditLog;
}

const ExpandedRow: React.FC<ExpandedRowProps> = ({ log }) => {
  const renderValues = (values: Record<string, unknown> | null, label: string) => {
    if (!values || Object.keys(values).length === 0) {
      return null;
    }

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-2">{label}</h4>
        <div className="bg-[#1E293B] rounded-md p-3 overflow-x-auto">
          <pre className="text-xs text-[#A0AEC0] whitespace-pre-wrap">
            {JSON.stringify(values, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-3 bg-[#1E293B] border-t border-[#4A5568]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderValues(log.old_values, 'Old Values')}
        {renderValues(log.new_values, 'New Values')}
      </div>
      {log.user_agent && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-white mb-2">User Agent</h4>
          <p className="text-xs text-[#A0AEC0] break-all">{log.user_agent}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Audit Logs Page
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */
export default function AuditLogsPage() {
  const { toasts, removeToast, error: showError } = useToast();

  // Data state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filter state - Validates: Requirements 11.2, 11.3, 11.4
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  // Available resource types (populated from data)
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);

  /**
   * Toggle row expansion
   */
  const toggleRowExpansion = useCallback((logId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }, []);

  /**
   * Fetch audit logs from API with filters and pagination
   * Validates: Requirements 11.1, 11.2, 11.3, 11.4
   */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      // Add date range filter - Validates: Requirements 11.2
      if (dateRange.from) {
        params.from_date = dateRange.from;
      }
      if (dateRange.to) {
        params.to_date = dateRange.to;
      }

      // Add user filter - Validates: Requirements 11.3
      if (userFilter) {
        params.user_id = userFilter;
      }

      // Add action filter - Validates: Requirements 11.4
      if (actionFilter) {
        params.action = actionFilter;
      }

      // Add resource filter
      if (resourceFilter) {
        params.resource = resourceFilter;
      }

      const response = await apiClient.get<unknown>('/audit-logs', params);
      const responseData = response.data;

      // Handle Laravel's paginated response format
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        const paginatedData = responseData as {
          current_page: number;
          data: AuditLog[];
          last_page: number;
          per_page: number;
          total: number;
        };
        const logsArray = Array.isArray(paginatedData.data) ? paginatedData.data : [];
        setLogs(logsArray);
        setCurrentPage(paginatedData.current_page || 1);
        setLastPage(paginatedData.last_page || 1);
        setPerPage(paginatedData.per_page || 10);
        setTotal(paginatedData.total || 0);

        // Extract unique resource types from data
        const resources = [...new Set(logsArray.map((log) => log.resource))];
        setResourceTypes((prev) => {
          const combined = [...new Set([...prev, ...resources])];
          return combined.sort();
        });
      } else if (Array.isArray(responseData)) {
        // Fallback for non-paginated response
        setLogs(responseData as AuditLog[]);
        
        // Extract unique resource types
        const resources = [...new Set((responseData as AuditLog[]).map((log) => log.resource))];
        setResourceTypes(resources.sort());
      } else {
        setLogs([]);
      }
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, dateRange, userFilter, actionFilter, resourceFilter, showError]);

  /**
   * Fetch users for the user filter dropdown
   */
  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.get<unknown>('/users');
      const responseData = response.data;
      if (Array.isArray(responseData)) {
        setUsers(responseData as User[]);
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        // Handle Laravel's paginated response
        const paginatedData = responseData as { data: User[] };
        setUsers(Array.isArray(paginatedData.data) ? paginatedData.data : []);
      }
    } catch (err) {
      // Silently fail - users filter is optional
      console.error('Failed to fetch users:', err);
    }
  }, []);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, userFilter, actionFilter, resourceFilter]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Table columns configuration
   * Validates: Requirements 11.1
   */
  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'expand',
      header: '',
      width: '40px',
      render: (log) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRowExpansion(log.id);
          }}
          className="p-1 text-[#A0AEC0] hover:text-white transition-colors"
          aria-label={expandedRows.has(log.id) ? 'Collapse row' : 'Expand row'}
        >
          {expandedRows.has(log.id) ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-[#A0AEC0] whitespace-nowrap">
          {formatTimestamp(log.created_at)}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (log) => (
        <span className="text-white">
          {log.user?.name || log.user?.email || 'System'}
        </span>
      ),
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
        <span className="text-[#A0AEC0] capitalize">{log.resource}</span>
      ),
    },
    {
      key: 'resource_id',
      header: 'Resource ID',
      render: (log) => (
        <span className="text-[#A0AEC0]">{log.resource_id ?? '-'}</span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (log) => (
        <span className="text-[#A0AEC0] font-mono text-xs">
          {log.ip_address || '-'}
        </span>
      ),
    },
  ];

  // Action filter options - Validates: Requirements 11.4
  const actionOptions = [
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
  ];

  // User filter options - Validates: Requirements 11.3
  const userOptions = users.map((user) => ({
    value: String(user.id),
    label: user.name || user.email,
  }));

  // Resource filter options
  const resourceOptions = resourceTypes.map((resource) => ({
    value: resource,
    label: resource.charAt(0).toUpperCase() + resource.slice(1),
  }));

  /**
   * Custom row renderer to include expandable content
   */
  const renderRow = (log: AuditLog, rowContent: React.ReactNode) => (
    <React.Fragment key={log.id}>
      {rowContent}
      {expandedRows.has(log.id) && (
        <tr>
          <td colSpan={columns.length}>
            <ExpandedRow log={log} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-[#4A90E2]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-[#A0AEC0] mt-1">
            Monitor system activity and user actions
          </p>
        </div>
      </div>

      {/* Filters - Validates: Requirements 11.2, 11.3, 11.4 */}
      <div className="bg-[#2D3748] rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Date range filter - Validates: Requirements 11.2 */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-[#A0AEC0] mb-1">
              Date Range
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {/* User filter - Validates: Requirements 11.3 */}
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-[#A0AEC0] mb-1">
              User
            </label>
            <FilterSelect
              value={userFilter}
              onChange={setUserFilter}
              options={userOptions}
              placeholder="All Users"
              className="w-full"
            />
          </div>

          {/* Action filter - Validates: Requirements 11.4 */}
          <div className="w-full sm:w-40">
            <label className="block text-sm font-medium text-[#A0AEC0] mb-1">
              Action
            </label>
            <FilterSelect
              value={actionFilter}
              onChange={setActionFilter}
              options={actionOptions}
              placeholder="All Actions"
              className="w-full"
            />
          </div>

          {/* Resource filter */}
          <div className="w-full sm:w-40">
            <label className="block text-sm font-medium text-[#A0AEC0] mb-1">
              Resource
            </label>
            <FilterSelect
              value={resourceFilter}
              onChange={setResourceFilter}
              options={resourceOptions}
              placeholder="All Resources"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Audit logs table with expandable rows - Validates: Requirements 11.1, 11.5, 11.6 */}
      <div className="overflow-x-auto rounded-lg border border-[#4A5568]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#3B4B63]">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-[#FFFFFF]"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4A5568]">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <div className="h-4 bg-[#3B4B63] rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[#A0AEC0]"
                >
                  No audit logs found
                </td>
              </tr>
            ) : (
              // Data rows with expandable content
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className="bg-[#2D3748] hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150 cursor-pointer"
                    onClick={() => toggleRowExpansion(log.id)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-4 py-3 text-sm text-[#A0AEC0]"
                      >
                        {column.render ? column.render(log) : String(log[column.key as keyof AuditLog] ?? '-')}
                      </td>
                    ))}
                  </tr>
                  {expandedRows.has(log.id) && (
                    <tr>
                      <td colSpan={columns.length} className="p-0">
                        <ExpandedRow log={log} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

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
