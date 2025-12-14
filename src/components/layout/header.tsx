'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { User as UserType } from '@/types';
import { Avatar } from '@/components/ui/avatar';

export interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

/**
 * Header component with company logo, user avatar dropdown, and mobile sidebar toggle
 * Validates: Requirements 5.4
 */
export const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <header className="h-16 bg-[#2D3748] border-b border-[#4A5568] flex items-center justify-between px-4 fixed top-0 right-0 left-0 z-30">
      {/* Left side - Mobile menu toggle and logo */}
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-[#A0AEC0] hover:bg-[#3B4B63] hover:text-white transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Company Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#4A90E2] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">ERP</span>
          </div>
          <span className="hidden sm:block text-lg font-semibold text-white">
            Dashboard
          </span>
        </Link>
      </div>

      {/* Right side - User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-md hover:bg-[#3B4B63] transition-colors duration-200"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <span className="hidden sm:block text-sm text-[#A0AEC0]">{user.name}</span>
          <ChevronDown
            className={`h-4 w-4 text-[#A0AEC0] transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-[#2D3748] border border-[#4A5568] rounded-md shadow-lg py-1 z-50">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#A0AEC0] hover:bg-[#3B4B63] hover:text-white transition-colors duration-200"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#A0AEC0] hover:bg-[#3B4B63] hover:text-white transition-colors duration-200"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Account Settings
            </Link>
            <hr className="my-1 border-[#4A5568]" />
            <button
              onClick={() => {
                setDropdownOpen(false);
                onLogout();
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#E53E3E] hover:bg-[#3B4B63] transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
