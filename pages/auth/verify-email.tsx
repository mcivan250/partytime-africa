'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to verify email');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('An error occurred while verifying your email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-secondary border border-border/30 rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
            </div>
            <h1 className="text-2xl font-bold text-text-light mb-2">Verifying Email</h1>
            <p className="text-text-dark">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 text-6xl">✓</div>
            <h1 className="text-2xl font-bold text-green-400 mb-2">Email Verified!</h1>
            <p className="text-text-dark mb-6">Your email has been successfully verified. You can now access all features.</p>
            <p className="text-text-dark text-sm">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 text-6xl">✕</div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h1>
            <p className="text-text-dark mb-6">{message}</p>
            <div className="space-y-3">
              <Link href="/auth/signin">
                <button className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-lg transition-colors">
                  Back to Sign In
                </button>
              </Link>
              <Link href="/auth/resend-verification">
                <button className="w-full bg-primary border border-border/30 text-text-light hover:border-accent/50 font-bold py-3 rounded-lg transition-colors">
                  Resend Verification Email
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
