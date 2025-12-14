'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { useAuth } from '@/hooks/use-auth';
import { LoginFormData } from '@/types';

/**
 * Login Page
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 * - 1.1: Authenticate user and store Bearer token
 * - 1.2: Display "Invalid email or password" for invalid credentials
 * - 1.3: Display message for unverified email
 * - 1.4: Display lockout message with remaining wait time
 * - 1.5: Display loading state on submit button and disable form inputs
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  // Redirect if already authenticated (disabled during login to prevent loops)
  // The redirect will happen after successful login in handleSubmit

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setGeneralError('');
    
    const result = await login(formData);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      // Handle specific error messages
      // Validates: Requirements 1.2, 1.3, 1.4
      setGeneralError(result.error || 'An unexpected error occurred');
    }
  };

  return (
    <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-[#A0AEC0]">Sign in to your account</p>
      </div>

      {/* General Error Message */}
      {generalError && (
        <div className="mb-6 p-4 bg-[#E53E3E]/10 border border-[#E53E3E] rounded-md">
          <p className="text-[#E53E3E] text-sm">{generalError}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <FormField
          label="Email"
          name="email"
          error={errors.email}
          required
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={isLoading}
            error={!!errors.email}
            autoComplete="email"
          />
        </FormField>

        {/* Password Field */}
        <FormField
          label="Password"
          name="password"
          error={errors.password}
          required
        >
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={isLoading}
            error={!!errors.password}
            autoComplete="current-password"
          />
        </FormField>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[#4A5568] bg-[#3B4B63] text-[#4A90E2] focus:ring-[#6772E5] focus:ring-offset-0"
            />
            <span className="text-sm text-[#A0AEC0]">Remember me</span>
          </label>
          
          <Link
            href="/forgot-password"
            className="text-sm text-[#4A90E2] hover:text-[#6B80E5] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-[#A0AEC0] text-sm">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[#4A90E2] hover:text-[#6B80E5] transition-colors font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
