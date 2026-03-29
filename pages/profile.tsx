'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data);
      setName(data.name || '');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').upsert({ id: user.id, name, email: user.email });
      if (error) throw error;
      setEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none' }}>
            Party Time Africa
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Dashboard</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-accent)', textAlign: 'center', marginBottom: '2rem' }}>
          My Profile
        </h1>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', fontSize: '2.5rem', color: 'var(--color-primary)', fontWeight: 'bold'
          }}>
            {(profile?.name || user.email || '?')[0].toUpperCase()}
          </div>
        </div>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Name</label>
            {editing ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Your name" />
            ) : (
              <p style={{ color: 'var(--color-text-light)', fontSize: '1.1rem' }}>{profile?.name || 'Not set'}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <p style={{ color: 'var(--color-text-light)', fontSize: '1.1rem' }}>{user.email}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Member Since</label>
            <p style={{ color: 'var(--color-text-dark)' }}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setEditing(false); setName(profile?.name || ''); }} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-primary" style={{ flex: 1 }}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={() => { signOut(); router.push('/'); }} className="btn btn-secondary">
            Sign Out
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-dark)' }}>© 2026 Party Time Africa. All rights reserved.</p>
      </footer>
    </div>
  );
}
