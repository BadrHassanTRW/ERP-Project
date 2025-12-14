'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { useAuth } from '@/hooks/use-auth';
import { RegisterFormData } from '@/types';

/**
 * Registration Page
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 * - 2.1: Create account and display success message prompting email verification
 * - 2.2: Display "The email has already been taken" for duplicate email
 * - 2.3: Display "The password must be at least 8 characters" for short password
 * - 2.4: Display "The password confirmation does not match" for mismatch
 * - 2.5: Display loading state on submit button
 */
export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validates: Requirements 2.3
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'The password must be at least 8 characters';
    }
    
    // Validates: Requirements 2.4
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'The password confirmation does not match';
    }
    
    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
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
    setSuccessMessage('');
    
    const result = await register(formData);
    
    if (result.success) {
      // Validates: Requirements 2.1
      setSuccessMessage(
        'Registration successful! Please check your email to verify your account before logging in.'
      );
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
      });
      setTermsAccepted(false);
    } else {
      // Handle specific error messages
      // Validates: Requirements 2.2
      setGeneralError(result.error || 'An unexpected error occurred');
    }
  };

  return (
    <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-[#A0AEC0]">Register for a new account</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-[#38A169]/10 border border-[#38A169] rounded-md">
          <p className="text-[#38A169] text-sm">{successMessage}</p>
          <Link
            href="/login"
            className="text-[#4A90E2] hover:text-[#6B80E5] text-sm font-medium mt-2 inline-block"
          >
            Go to Login
          </Link>
        </div>
      )}

      {/* General Error Message */}
      {generalError && (
        <div className="mb-6 p-4 bg-[#E53E3E]/10 border border-[#E53E3E] rounded-md">
          <p className="text-[#E53E3E] text-sm">{generalError}</p>
        </div>
      )}

      {/* Registration Form */}
      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <FormField
            label="Name"
            name="name"
            error={errors.name}
            required
          >
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isLoading}
              error={!!errors.name}
              autoComplete="name"
            />
          </FormField>

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
              placeholder="Enter your password (min. 8 characters)"
              disabled={isLoading}
              error={!!errors.password}
              autoComplete="new-password"
            />
          </FormField>

          {/* Password Confirmation Field */}
          <FormField
            label="Confirm Password"
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
              placeholder="Confirm your password"
              disabled={isLoading}
              error={!!errors.password_confirmation}
              autoComplete="new-password"
            />
          </FormField>

          {/* Terms Checkbox */}
          <div className="space-y-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (errors.terms) {
                    setErrors(prev => ({ ...prev, terms: '' }));
                  }
                }}
                disabled={isLoading}
                className="w-4 h-4 mt-0.5 rounded border-[#4A5568] bg-[#3B4B63] text-[#4A90E2] focus:ring-[#6772E5] focus:ring-offset-0"
              />
              <span className="text-sm text-[#A0AEC0]">
                I agree to the{' '}
                <Link href="/terms" className="text-[#4A90E2] hover:text-[#6B80E5]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#4A90E2] hover:text-[#6B80E5]">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-sm text-[#E53E3E]">{errors.terms}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      )}

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-[#A0AEC0] text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#4A90E2] hover:text-[#6B80E5] transition-colors font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
