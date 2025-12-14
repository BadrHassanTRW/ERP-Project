'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { apiClient, getErrorMessage } from '@/lib/api';
import { ForgotPasswordFormData } from '@/types';

/**
 * Forgot Password Page
 * Validates: Requirements 3.1
 * - Display generic success message "If the email exists, a reset link has been sent" for security
 */
export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setGeneralError('');
    setSuccessMessage('');
    
    try {
      await apiClient.post('/auth/forgot-password', formData);
      
      // Validates: Requirements 3.1
      // Always show generic success message for security
      setSuccessMessage(
        'If the email exists, a reset link has been sent. Please check your inbox.'
      );
      // Clear form
      setFormData({ email: '' });
    } catch (error) {
      // Even on error, show generic message for security
      // This prevents email enumeration attacks
      setSuccessMessage(
        'If the email exists, a reset link has been sent. Please check your inbox.'
      );
      // Only show actual error for network/server issues
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('network') || errorMessage.includes('server')) {
        setGeneralError(errorMessage);
        setSuccessMessage('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
        <p className="text-[#A0AEC0]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
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
        </div>
      )}

      {/* Forgot Password Form */}
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

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

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
