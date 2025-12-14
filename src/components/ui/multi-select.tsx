'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { Badge } from './badge';

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = useCallback(
    (optionValue: string | number) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    },
    [value, onChange]
  );

  const removeOption = useCallback(
    (optionValue: string | number, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== optionValue));
    },
    [value, onChange]
  );

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full min-h-[42px] px-3 py-2
          bg-[#3B4B63] border border-[#4A5568] rounded-md
          text-left flex items-center justify-between gap-2
          focus:border-[#6772E5] focus:ring-2 focus:ring-[#6772E5]/20 focus:outline-none
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-[#718096]">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="info"
                size="sm"
                className="flex items-center gap-1"
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeOption(option.value, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      removeOption(option.value, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="hover:text-white/80 transition-colors cursor-pointer"
                  aria-label={`Remove ${option.label}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#718096] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute z-50 w-full mt-1
            bg-[#2D3748] border border-[#4A5568] rounded-md
            shadow-lg max-h-60 overflow-auto
          "
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[#718096] text-sm">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={`
                    w-full px-3 py-2 text-left text-sm
                    flex items-center justify-between
                    hover:bg-[#3B4B63] transition-colors duration-150
                    ${isSelected ? 'text-[#4A90E2]' : 'text-[#A0AEC0]'}
                  `}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
