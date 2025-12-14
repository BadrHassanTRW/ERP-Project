/**
 * Layout Components
 * Export all layout-related components for the dashboard
 */

export { Sidebar, filterNavItemsByPermission, defaultNavItems } from './sidebar';
export type { SidebarProps } from './sidebar';

export { Header } from './header';
export type { HeaderProps } from './header';

export { Breadcrumb, generateBreadcrumbsFromPath } from './breadcrumb';
export type { BreadcrumbProps } from './breadcrumb';

export { DashboardLayout } from './dashboard-layout';
export type { DashboardLayoutProps } from './dashboard-layout';

export { ProtectedRoute } from './protected-route';
export type { ProtectedRouteProps } from './protected-route';

export { Can, checkPermission, checkAnyPermission, checkAllPermissions } from './can';
export type { CanProps } from './can';
