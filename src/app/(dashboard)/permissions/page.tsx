'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/lib/api';
import type { Permission, GroupedPermissions, ApiResponse } from '@/types';

/**
 * Permissions List Page
 * Displays all permissions grouped by module with expandable sections
 * Validates: Requirements 10.1, 10.2, 10.3
 */
export default function PermissionsListPage() {
  const { toasts, removeToast, error: showError } = useToast();

  // Data state
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded modules state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  /**
   * Fetch permissions grouped by module from API
   * Validates: Requirements 10.1
   */
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<unknown>('/permissions/grouped');
      
      // Handle the response - Laravel returns { permissions: { module: [...] } }
      let groupedData: GroupedPermissions = {};
      
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        
        // Check if permissions are nested under 'permissions' key
        if ('permissions' in data && data.permissions && typeof data.permissions === 'object') {
          groupedData = data.permissions as GroupedPermissions;
        } else {
          // Direct grouped format - check if it has module keys with arrays
          const keys = Object.keys(data);
          const hasModuleArrays = keys.length > 0 && keys.some(k => Array.isArray(data[k]));
          if (hasModuleArrays) {
            groupedData = data as GroupedPermissions;
          }
        }
      }
      
      setGroupedPermissions(groupedData);
      // Expand all modules by default
      setExpandedModules(new Set(Object.keys(groupedData)));
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Fetch data on mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);


  /**
   * Filter permissions by search term (name or module)
   * Validates: Requirements 10.2
   */
  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) {
      return groupedPermissions;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const filtered: GroupedPermissions = {};

    Object.entries(groupedPermissions).forEach(([module, permissions]) => {
      // Check if module name matches
      const moduleMatches = module.toLowerCase().includes(lowerSearch);
      
      // Filter permissions by name or description
      const matchingPermissions = permissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(lowerSearch) ||
          (permission.description && permission.description.toLowerCase().includes(lowerSearch))
      );

      // Include module if it matches or has matching permissions
      if (moduleMatches) {
        filtered[module] = permissions;
      } else if (matchingPermissions.length > 0) {
        filtered[module] = matchingPermissions;
      }
    });

    return filtered;
  }, [groupedPermissions, searchTerm]);

  /**
   * Toggle module expansion
   */
  const toggleModule = useCallback((module: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  }, []);

  /**
   * Expand all modules
   */
  const expandAll = useCallback(() => {
    setExpandedModules(new Set(Object.keys(filteredPermissions)));
  }, [filteredPermissions]);

  /**
   * Collapse all modules
   */
  const collapseAll = useCallback(() => {
    setExpandedModules(new Set());
  }, []);

  /**
   * Get total permission count
   */
  const totalPermissions = useMemo(() => {
    return Object.values(filteredPermissions).reduce(
      (total, permissions) => total + permissions.length,
      0
    );
  }, [filteredPermissions]);

  /**
   * Get module count
   */
  const moduleCount = useMemo(() => {
    return Object.keys(filteredPermissions).length;
  }, [filteredPermissions]);

  /**
   * Format module name for display
   */
  const formatModuleName = (module: string): string => {
    return module
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Render loading skeleton
   */
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[#2D3748] rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#3B4B63] rounded" />
            <div className="h-5 w-32 bg-[#3B4B63] rounded" />
            <div className="h-5 w-16 bg-[#3B4B63] rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );


  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <div className="bg-[#2D3748] rounded-lg p-8 text-center">
      <Shield className="h-12 w-12 text-[#718096] mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">No permissions found</h3>
      <p className="text-[#A0AEC0]">
        {searchTerm
          ? 'No permissions match your search criteria. Try a different search term.'
          : 'No permissions are available in the system.'}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Permissions</h1>
          <p className="text-[#A0AEC0] mt-1">
            View all system permissions grouped by module
          </p>
        </div>
      </div>

      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search input - Validates: Requirements 10.2 */}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by permission name or module..."
          className="w-full sm:w-80"
        />

        {/* Expand/Collapse controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm text-[#A0AEC0] hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span className="text-[#4A5568]">|</span>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm text-[#A0AEC0] hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm text-[#A0AEC0]">
          <span>
            <strong className="text-white">{moduleCount}</strong> modules
          </span>
          <span>•</span>
          <span>
            <strong className="text-white">{totalPermissions}</strong> permissions
          </span>
        </div>
      )}

      {/* Permissions list - Validates: Requirements 10.1, 10.3 */}
      {loading ? (
        renderSkeleton()
      ) : moduleCount === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-3">
          {Object.entries(filteredPermissions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([module, permissions]) => {
              const isExpanded = expandedModules.has(module);
              
              return (
                <div
                  key={module}
                  className="bg-[#2D3748] rounded-lg overflow-hidden"
                >
                  {/* Module header - clickable to expand/collapse */}
                  <button
                    onClick={() => toggleModule(module)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-[#3B4B63]/50 transition-colors"
                  >
                    {/* Expand/collapse icon */}
                    <span className="text-[#A0AEC0]">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </span>

                    {/* Module icon */}
                    <div className="p-2 rounded-lg bg-[#4A90E2]/20">
                      <Shield className="h-4 w-4 text-[#4A90E2]" />
                    </div>

                    {/* Module name */}
                    <span className="font-medium text-white">
                      {formatModuleName(module)}
                    </span>

                    {/* Permission count badge */}
                    <Badge variant="info" size="sm" className="ml-auto">
                      {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                    </Badge>
                  </button>

                  {/* Expandable permissions list - Validates: Requirements 10.3 */}
                  {isExpanded && (
                    <div className="border-t border-[#3B4B63]">
                      <div className="divide-y divide-[#3B4B63]">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="px-4 py-3 pl-14 hover:bg-[#3B4B63]/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#E2E8F0] text-sm">
                                  {permission.name}
                                </p>
                                {permission.description && (
                                  <p className="text-[#A0AEC0] text-sm mt-0.5">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
