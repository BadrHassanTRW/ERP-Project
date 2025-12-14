'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  LucideIcon,
} from 'lucide-react';
import { NavItem } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

/**
 * Icon mapping for navigation items
 */
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  roles: Shield,
  permissions: Key,
  'audit-logs': FileText,
  settings: Settings,
};

/**
 * Default navigation items for the sidebar
 * Validates: Requirements 5.1, 14.2
 */
export const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard', permission: null },
  { label: 'Users', icon: 'users', href: '/users', permission: 'users.view' },
  { label: 'Roles', icon: 'roles', href: '/roles', permission: 'roles.view' },
  { label: 'Permissions', icon: 'permissions', href: '/permissions', permission: 'permissions.view' },
  { label: 'Audit Logs', icon: 'audit-logs', href: '/audit-logs', permission: 'audit_logs.view' },
  { label: 'Settings', icon: 'settings', href: '/settings', permission: 'settings.view' },
];


/**
 * Filters navigation items based on user permissions
 * Validates: Requirements 5.1, 14.2
 * @param items - Array of navigation items
 * @param hasPermission - Function to check if user has a permission
 * @returns Filtered array of navigation items the user can access
 */
export const filterNavItemsByPermission = (
  items: NavItem[],
  hasPermission: (permission: string) => boolean
): NavItem[] => {
  return items.filter((item) => {
    // If no permission required, show the item
    if (item.permission === null) return true;
    // Otherwise, check if user has the required permission
    return hasPermission(item.permission);
  });
};

/**
 * Sidebar component with navigation items, collapsed/expanded states, and permission filtering
 * Validates: Requirements 5.1, 5.2, 5.3, 14.2, 16.1
 */
export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, isMobile = false, onClose }) => {
  const pathname = usePathname();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  // Filter nav items based on user permissions
  const filteredNavItems = filterNavItemsByPermission(defaultNavItems, hasPermission);

  // Handle navigation click on mobile - close the menu
  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#2D3748] border-r border-[#4A5568] transition-all duration-300 z-40 ${
        isMobile ? 'w-full sm:w-80' : collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo/Brand Area */}
      <div className="h-16 flex items-center justify-between border-b border-[#4A5568] px-4">
        <div className="flex items-center">
          {(!collapsed || isMobile) && (
            <span className="text-xl font-bold text-white">ERP Dashboard</span>
          )}
          {collapsed && !isMobile && (
            <span className="text-xl font-bold text-white">ERP</span>
          )}
        </div>
        {/* Close button for mobile */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#A0AEC0] hover:bg-[#3B4B63] hover:text-white transition-colors duration-200"
            aria-label="Close navigation"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="mt-4 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-[#4A90E2] text-white'
                      : 'text-[#A0AEC0] hover:bg-[#3B4B63] hover:text-white'
                  } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle Button - only show on desktop */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-md bg-[#3B4B63] text-[#A0AEC0] hover:bg-[#4A5568] hover:text-white transition-colors duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
