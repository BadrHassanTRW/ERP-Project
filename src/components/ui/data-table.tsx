'use client';

import React, { useState, useEffect } from 'react';
import type { DataTableColumn, PaginationProps } from '@/types';

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationProps;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  emptyMessage?: string;
  keyExtractor?: (row: T) => string | number;
  /** Columns to show in card view on mobile (defaults to first 3 columns) */
  mobileColumns?: (keyof T | string)[];
  /** Force card view regardless of screen size */
  forceCardView?: boolean;
}

// Skeleton row for loading state (table view)
const SkeletonRow: React.FC<{ columnCount: number }> = ({ columnCount }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columnCount }).map((_, index) => (
      <td key={index} className="px-4 py-3">
        <div className="h-4 bg-[#3B4B63] rounded w-3/4"></div>
      </td>
    ))}
  </tr>
);

// Skeleton card for loading state (card view)
const SkeletonCard: React.FC = () => (
  <div className="bg-[#2D3748] rounded-lg p-4 animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-[#3B4B63] rounded w-3/4"></div>
      <div className="h-4 bg-[#3B4B63] rounded w-1/2"></div>
      <div className="h-4 bg-[#3B4B63] rounded w-2/3"></div>
    </div>
  </div>
);

/**
 * DataTable component with responsive design
 * - Desktop/Tablet: Traditional table with horizontal scroll
 * - Mobile: Card-based layout for better readability
 * Validates: Requirements 6.1, 15.5, 16.4
 */
export function DataTable<T extends object>({
  columns,
  data: rawData,
  loading = false,
  onRowClick,
  emptyMessage = 'No data available',
  keyExtractor,
  mobileColumns,
  forceCardView = false,
}: DataTableProps<T>) {
  // Ensure data is always an array
  const data = Array.isArray(rawData) ? rawData : [];
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive breakpoint detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getRowKey = (row: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(row);
    if ('id' in row) return row.id as string | number;
    return index;
  };

  const getCellValue = (row: T, column: DataTableColumn<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row);
    }
    const key = column.key as keyof T;
    const value = row[key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Get columns to display in card view
  const getCardColumns = (): DataTableColumn<T>[] => {
    if (mobileColumns) {
      return columns.filter((col) => mobileColumns.includes(col.key));
    }
    // Default to first 4 columns for card view
    return columns.slice(0, 4);
  };

  const showCardView = forceCardView || isMobile;

  // Card-based view for mobile
  if (showCardView) {
    const cardColumns = getCardColumns();

    return (
      <div className="space-y-3">
        {loading ? (
          // Loading skeleton cards
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : data.length === 0 ? (
          // Empty state
          <div className="bg-[#2D3748] rounded-lg p-8 text-center text-[#A0AEC0]">
            {emptyMessage}
          </div>
        ) : (
          // Data cards
          data.map((row, rowIndex) => (
            <div
              key={getRowKey(row, rowIndex)}
              onClick={() => onRowClick?.(row)}
              className={`
                bg-[#2D3748] rounded-lg p-4 border border-[#4A5568]
                hover:bg-[rgba(255,255,255,0.05)] 
                transition-colors duration-150
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              <div className="space-y-2">
                {cardColumns.map((column, colIndex) => (
                  <div
                    key={String(column.key)}
                    className={`flex justify-between items-start gap-2 ${
                      colIndex === 0 ? 'pb-2 border-b border-[#4A5568]' : ''
                    }`}
                  >
                    <span className="text-xs font-medium text-[#718096] uppercase tracking-wide">
                      {column.header}
                    </span>
                    <span
                      className={`text-sm text-right ${
                        colIndex === 0 ? 'text-white font-medium' : 'text-[#A0AEC0]'
                      }`}
                    >
                      {getCellValue(row, column)}
                    </span>
                  </div>
                ))}
              </div>
              {/* Show "View more" indicator if there are more columns */}
              {columns.length > cardColumns.length && (
                <div className="mt-3 pt-2 border-t border-[#4A5568]">
                  <span className="text-xs text-[#6772E5]">
                    Tap to view all {columns.length} fields →
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  // Table view for tablet/desktop with horizontal scroll
  return (
    <div className="overflow-x-auto rounded-lg border border-[#4A5568] -mx-4 sm:mx-0">
      <div className="min-w-full inline-block align-middle">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#3B4B63]">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-[#FFFFFF] whitespace-nowrap"
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
                <SkeletonRow key={index} columnCount={columns.length} />
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[#A0AEC0]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    bg-[#2D3748] 
                    hover:bg-[rgba(255,255,255,0.05)] 
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm text-[#A0AEC0] whitespace-nowrap"
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
