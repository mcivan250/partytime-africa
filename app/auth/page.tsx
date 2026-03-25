'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, signInWithEmail, signInWithPhone, verifyOTP, createWallet } from '@/lib/auth';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'phone'>('signin');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
  });

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await signUpWithEmail(formData.email, formData.password, formData.name);
      await createWallet(user.id);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmail(formData.email, formData.password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!otpSent) {
        await signInWithPhone(formData.phone);
        setOtpSent(true);
      } else {
        const user = await verifyOTP(formData.phone, formData.otp);
        if (user) {
          await createWallet(user.id);
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify phone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-bold text-white mb-2">Party Time</h1>
            <p className="text-white/80">Turn up, African style 🎉</p>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Method Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => {
                setMethod('email');
                setOtpSent(false);
              }}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                method === 'email'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => {
                setMethod('phone');
                setMode('phone');
                setOtpSent(false);
              }}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                method === 'phone'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              📱 Phone
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Email Auth */}
          {method === 'email' && (
            <>
              {/* Mode Tabs */}
              {mode !== 'phone' && (
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={() => setMode('signin')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      mode === 'signin'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-2 text-sm font-medium ${
                      mode === 'signup'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <form onSubmit={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Chris Mugabo"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
                >
                  {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {/* Phone Auth */}
          {method === 'phone' && (
            <form onSubmit={handlePhoneSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+256 700 000 000"
                  required
                  disabled={otpSent}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP Code
                  </label>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-center text-2xl font-mono"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    We sent a code to {formData.phone}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
              >
                {loading ? 'Loading...' : otpSent ? 'Verify Code' : 'Send Code'}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-purple-600 text-sm font-medium hover:underline"
                >
                  ← Change Phone Number
                </button>
              )}
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-purple-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-8 text-center text-white/80 text-sm">
          <p>Trusted by event organizers across Uganda 🇺🇬</p>
        </div>
      </div>
    </div>
  );
}
