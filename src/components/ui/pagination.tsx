'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationProps } from '@/types';

export interface PaginationComponentProps extends PaginationProps {
  className?: string;
}

export const Pagination: React.FC<PaginationComponentProps> = ({
  currentPage,
  lastPage,
  perPage,
  total,
  onPageChange,
  className = '',
}) => {
  const startItem = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < lastPage;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (lastPage <= maxVisiblePages) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(lastPage - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < lastPage - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (lastPage > 1) {
        pages.push(lastPage);
      }
    }

    return pages;
  };

  const buttonBaseStyles = `
    inline-flex items-center justify-center
    w-8 h-8 rounded-md
    text-sm font-medium
    transition-colors duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const buttonStyles = `
    ${buttonBaseStyles}
    text-[#A0AEC0] hover:bg-[#3B4B63] hover:text-white
  `;

  const activeButtonStyles = `
    ${buttonBaseStyles}
    bg-[#4A90E2] text-white
  `;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Items info */}
      <div className="text-sm text-[#A0AEC0]">
        Showing <span className="font-medium text-white">{startItem}</span> to{' '}
        <span className="font-medium text-white">{endItem}</span> of{' '}
        <span className="font-medium text-white">{total}</span> results
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className={buttonStyles}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className={buttonStyles}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-[#A0AEC0]">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={page === currentPage ? activeButtonStyles : buttonStyles}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={buttonStyles}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(lastPage)}
          disabled={!canGoNext}
          className={buttonStyles}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
