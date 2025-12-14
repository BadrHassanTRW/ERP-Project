'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}) => {
  // Internal state for uncontrolled mode and debouncing
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');
  
  // Track if we're in controlled mode
  const isControlled = controlledValue !== undefined;
  
  // The value to display - use controlled value if provided
  const displayValue = isControlled ? controlledValue : internalValue;

  // Debounced onChange for uncontrolled mode
  useEffect(() => {
    // Skip debounce for controlled mode - parent handles it
    if (isControlled) return;
    
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, isControlled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    // For controlled mode, call onChange immediately
    if (isControlled) {
      onChange(newValue);
    }
  }, [isControlled, onChange]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-[#718096]" />
      </div>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full pl-10 pr-10 py-2
          bg-[#3B4B63] border border-[#4A5568] rounded-md
          text-[#FFFFFF] placeholder-[#718096]
          focus:border-[#6772E5] focus:ring-2 focus:ring-[#6772E5]/20 focus:outline-none
          transition-all duration-200
        "
      />
      {displayValue && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute inset-y-0 right-0 pr-3 flex items-center
            text-[#718096] hover:text-[#A0AEC0]
            transition-colors duration-150
          "
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
