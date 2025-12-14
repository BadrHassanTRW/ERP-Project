'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { apiClient, getErrorMessage, getValidationErrors } from '@/lib/api';
import { ResetPasswordFormData } from '@/types';

/**
 * Reset Password Form Component
 * Validates: Requirements 3.2, 3.3, 3.4
 * - 3.2: Update password and redirect to login with success message
 * - 3.3: Display error for invalid/expired token
 * - 3.4: Display validation errors for password requirements
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<Omit<ResetPasswordFormData, 'token'>>({
    email: '',
    password: '',
    password_confirmation: '',
  });
  
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Extract token and email from URL query parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam) {
      setToken(tokenParam);
    }
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    
    // Validates: Requirements 3.4
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'The password must be at least 8 characters';
    }
    
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'The password confirmation does not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setGeneralError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setGeneralError('');
    setSuccessMessage('');
    
    try {
      await apiClient.post('/auth/reset-password', {
        ...formData,
        token,
      });
      
      // Validates: Requirements 3.2
      setSuccessMessage('Your password has been reset successfully. Redirecting to login...');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?message=password_reset_success');
      }, 2000);
    } catch (error) {
      // Handle validation errors
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(fieldErrors);
        
        // Check for token-specific errors
        // Validates: Requirements 3.3
        if (validationErrors.token) {
          setGeneralError('This password reset link is invalid or has expired. Please request a new one.');
        }
      } else {
        const errorMessage = getErrorMessage(error);
        // Validates: Requirements 3.3
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('expired') ||
            errorMessage.toLowerCase().includes('invalid')) {
          setGeneralError('This password reset link is invalid or has expired. Please request a new one.');
        } else {
          setGeneralError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show error if no token is present
  if (!token && !searchParams.get('token')) {
    return (
      <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
        </div>
        <div className="mb-6 p-4 bg-[#E53E3E]/10 border border-[#E53E3E] rounded-md">
          <p className="text-[#E53E3E] text-sm">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-[#4A90E2] hover:text-[#6B80E5] transition-colors text-sm font-medium"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-[#A0AEC0]">Enter your new password below.</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-[#38A169]/10 border border-[#38A169] rounded-md">
          <p className="text-[#38A169] text-sm">{successMessage}</p>
        </div>
      )}

      {/* General Error Message */}
      {generalError && (
        <div className="mb-6 p-4 bg-[#E53E3E]/10 border border-[#E53E3E] rounded-md">
          <p className="text-[#E53E3E] text-sm">{generalError}</p>
          {generalError.includes('expired') && (
            <Link
              href="/forgot-password"
              className="text-[#4A90E2] hover:text-[#6B80E5] text-sm font-medium mt-2 inline-block"
            >
              Request New Reset Link
            </Link>
          )}
        </div>
      )}

      {/* Reset Password Form */}
      {!successMessage && (
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

          {/* New Password Field */}
          <FormField
            label="New Password"
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
              placeholder="Enter your new password (min. 8 characters)"
              disabled={isLoading}
              error={!!errors.password}
              autoComplete="new-password"
            />
          </FormField>

          {/* Confirm Password Field */}
          <FormField
            label="Confirm New Password"
            name="password_confirmation"
            error={errors.password_confirmation}
            required
          >
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm your new password"
              disabled={isLoading}
              error={!!errors.password_confirmation}
              autoComplete="new-password"
            />
          </FormField>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      )}

      {/* Back to Login Link */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-[#4A90E2] hover:text-[#6B80E5] transition-colors text-sm font-medium"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

/**
 * Reset Password Page with Suspense boundary for useSearchParams
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-[#3B4B63] rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-[#3B4B63] rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
