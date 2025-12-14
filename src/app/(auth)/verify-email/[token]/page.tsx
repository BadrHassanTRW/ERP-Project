'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { apiClient, getErrorMessage } from '@/lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Email Verification Page
 * Validates: Requirements 4.1, 4.2, 4.3
 * - 4.1: Verify email with valid token and display success message with login link
 * - 4.2: Display error for invalid/expired token and offer to resend
 * - 4.3: Resend verification email and display confirmation
 */
export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Resend verification state
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');

  // Auto-verify on page load
  const verifyEmail = useCallback(async () => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('Invalid verification link. No token provided.');
      return;
    }

    try {
      await apiClient.post('/auth/verify-email', { token });
      
      // Validates: Requirements 4.1
      setVerificationStatus('success');
    } catch (error) {
      // Validates: Requirements 4.2
      setVerificationStatus('error');
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes('token') || 
          message.toLowerCase().includes('expired') ||
          message.toLowerCase().includes('invalid')) {
        setErrorMessage('This verification link is invalid or has expired.');
      } else {
        setErrorMessage(message);
      }
    }
  }, [token]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  // Handle resend verification email
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail.trim()) {
      setResendError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      setResendError('Please enter a valid email address');
      return;
    }
    
    setResendLoading(true);
    setResendError('');
    setResendSuccess('');
    
    try {
      await apiClient.post('/auth/resend-verification', { email: resendEmail });
      
      // Validates: Requirements 4.3
      setResendSuccess('Verification email sent! Please check your inbox.');
      setResendEmail('');
    } catch (error) {
      setResendError(getErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  };

  // Loading state
  if (verificationStatus === 'loading') {
    return (
      <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-[#4A90E2] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
          <p className="text-[#A0AEC0]">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (verificationStatus === 'success') {
    return (
      <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-[#38A169] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-[#A0AEC0] mb-6">
            Your email has been successfully verified. You can now log in to your account.
          </p>
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state with resend option
  return (
    <div className="bg-[#2D3748] rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <XCircle className="h-16 w-16 text-[#E53E3E] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
        <p className="text-[#A0AEC0]">{errorMessage}</p>
      </div>

      {/* Resend Verification Section */}
      {!showResendForm ? (
        <div className="text-center">
          <p className="text-[#A0AEC0] mb-4">
            Would you like to request a new verification email?
          </p>
          <Button
            variant="secondary"
            onClick={() => setShowResendForm(true)}
            className="mb-4"
          >
            Resend Verification Email
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Resend Verification Email</h2>
          
          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="mb-4 p-4 bg-[#38A169]/10 border border-[#38A169] rounded-md">
              <p className="text-[#38A169] text-sm">{resendSuccess}</p>
            </div>
          )}
          
          {/* Resend Error Message */}
          {resendError && (
            <div className="mb-4 p-4 bg-[#E53E3E]/10 border border-[#E53E3E] rounded-md">
              <p className="text-[#E53E3E] text-sm">{resendError}</p>
            </div>
          )}
          
          <form onSubmit={handleResendVerification} className="space-y-4">
            <FormField
              label="Email"
              name="resend_email"
              required
            >
              <Input
                id="resend_email"
                name="resend_email"
                type="email"
                value={resendEmail}
                onChange={(e) => {
                  setResendEmail(e.target.value);
                  setResendError('');
                }}
                placeholder="Enter your email"
                disabled={resendLoading}
                autoComplete="email"
              />
            </FormField>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowResendForm(false);
                  setResendEmail('');
                  setResendError('');
                  setResendSuccess('');
                }}
                disabled={resendLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={resendLoading}
                disabled={resendLoading}
                className="flex-1"
              >
                {resendLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Back to Login Link */}
      <div className="mt-6 text-center border-t border-[#4A5568] pt-6">
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
