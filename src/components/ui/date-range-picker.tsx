'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      from: e.target.value || null,
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      to: e.target.value || null,
    });
  };

  const inputStyles = `
    w-full px-3 py-2 pl-10
    bg-[#3B4B63] border border-[#4A5568] rounded-md
    text-[#FFFFFF] placeholder-[#718096]
    focus:border-[#6772E5] focus:ring-2 focus:ring-[#6772E5]/20 focus:outline-none
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    [color-scheme:dark]
  `;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* From date */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-[#718096]" />
        </div>
        <input
          type="date"
          value={value.from ?? ''}
          onChange={handleFromChange}
          disabled={disabled}
          className={inputStyles}
          aria-label="From date"
          max={value.to ?? undefined}
        />
      </div>

      <span className="text-[#718096]">to</span>

      {/* To date */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-[#718096]" />
        </div>
        <input
          type="date"
          value={value.to ?? ''}
          onChange={handleToChange}
          disabled={disabled}
          className={inputStyles}
          aria-label="To date"
          min={value.from ?? undefined}
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
