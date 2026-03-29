'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (authError) throw authError;

      // Create user profile in users table
      if (data.user) {
        await supabase.from('users').upsert({ id: data.user.id, name, email });
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none' }}>
              Party Time Africa
            </Link>
          </div>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-accent)', marginBottom: '1rem' }}>
              You're In!
            </h1>
            <p style={{ color: 'var(--color-text-dark)', marginBottom: '2rem', lineHeight: '1.6' }}>
              We've sent a confirmation email to <strong style={{ color: 'var(--color-text-light)' }}>{email}</strong>. Please check your inbox and click the link to verify your account.
            </p>
            <Link href="/auth/signin" className="btn btn-primary">Go to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none' }}>
            Party Time Africa
          </Link>
        </div>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚀</div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
              Join the Party
            </h1>
            <p style={{ color: 'var(--color-text-dark)' }}>Create an account to host and discover events.</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-error)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-error)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            <div className="card">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="At least 6 characters" required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-dark)' }}>
            Already have an account?{' '}
            <Link href="/auth/signin" style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
