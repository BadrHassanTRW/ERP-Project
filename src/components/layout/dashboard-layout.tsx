'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Breadcrumb, generateBreadcrumbsFromPath } from './breadcrumb';
import { useAuthStore } from '@/stores/auth-store';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout component combining Sidebar, Header, and Breadcrumb
 * Handles responsive behavior for mobile, tablet, and desktop
 * Validates: Requirements 5.1, 5.2, 5.3, 16.1, 16.2, 16.3
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track screen size for responsive behavior
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 640;
      const tablet = width >= 640 && width < 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Auto-collapse sidebar on tablet
      if (tablet) {
        setSidebarCollapsed(true);
      }
      // Close mobile menu when resizing to larger screen
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu handler
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Track previous pathname to detect route changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  
  // Close mobile menu on route change using comparison instead of direct setState
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Toggle sidebar (desktop/tablet)
  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Generate breadcrumbs from current path
  const breadcrumbItems = generateBreadcrumbsFromPath(pathname || '');

  // If not authenticated or no user, don't render layout
  if (!isAuthenticated || !user) {
    return null;
  }

  // Calculate main content margin based on sidebar state
  const mainMarginLeft = isMobile ? '0' : sidebarCollapsed ? '4rem' : '16rem';

  return (
    <div className="min-h-screen bg-[#1E293B]">
      {/* Mobile full-screen navigation overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Full-screen navigation */}
          <div className="fixed inset-0 z-50 flex">
            <Sidebar
              collapsed={false}
              onToggle={handleToggleSidebar}
              isMobile={true}
              onClose={closeMobileMenu}
            />
          </div>
        </>
      )}

      {/* Sidebar - hidden on mobile, shown on tablet/desktop */}
      {!isMobile && (
        <div className="transition-transform duration-300 z-40">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={handleToggleSidebar}
            isMobile={false}
          />
        </div>
      )}

      {/* Header */}
      <div
        style={{ marginLeft: mainMarginLeft }}
        className="transition-all duration-300"
      >
        <Header
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={handleToggleSidebar}
        />
      </div>

      {/* Main content */}
      <main
        style={{ marginLeft: mainMarginLeft }}
        className="pt-16 min-h-screen transition-all duration-300"
      >
        <div className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />
          
          {/* Page content */}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
