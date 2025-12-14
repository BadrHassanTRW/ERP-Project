'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Generates breadcrumb items from a route path
 * Validates: Requirements 5.5
 * @param pathname - Current route pathname
 * @returns Array of breadcrumb items representing the path hierarchy
 */
export const generateBreadcrumbsFromPath = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Format the label (capitalize and replace hyphens with spaces)
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Last item should not have href (current page)
    const isLast = i === segments.length - 1;
    
    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return items;
};

/**
 * Breadcrumb component displaying navigation hierarchy
 * Responsive: On mobile, shows only home and current page
 * Validates: Requirements 5.5, 16.1
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 overflow-x-auto">
      <ol className="flex items-center gap-1 sm:gap-2 text-sm whitespace-nowrap">
        {/* Home link */}
        <li className="flex-shrink-0">
          <Link
            href="/dashboard"
            className="text-[#A0AEC0] hover:text-white transition-colors duration-200"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          
          // On mobile (handled via CSS), show only first and last items
          // Middle items get hidden class on mobile
          const hideOnMobile = !isFirst && !isLast && items.length > 2;
          
          return (
            <li 
              key={index} 
              className={`flex items-center gap-1 sm:gap-2 ${hideOnMobile ? 'hidden sm:flex' : ''}`}
            >
              <ChevronRight className="h-4 w-4 text-[#718096] flex-shrink-0" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-[#A0AEC0] hover:text-white transition-colors duration-200 truncate max-w-[120px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white font-medium truncate max-w-[150px] sm:max-w-none" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
        
        {/* Show ellipsis on mobile when items are hidden */}
        {items.length > 2 && (
          <li className="flex sm:hidden items-center gap-1 order-1">
            <ChevronRight className="h-4 w-4 text-[#718096]" />
            <span className="text-[#718096]">...</span>
          </li>
        )}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
