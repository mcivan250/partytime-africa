'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { THEMES } from '@/lib/types';

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_time: '',
    location_address: '',
    theme: 'fire',
    max_capacity: '',
    is_guest_list_public: true,
    is_comments_enabled: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!formData.title || !formData.date_time || !formData.location_address) {
      setError('Please fill in all required fields (Title, Date, Location).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const slug = generateSlug(formData.title);
      const { data, error: insertError } = await supabase
        .from('events')
        .insert([{
          title: formData.title,
          slug,
          description: formData.description,
          date_time: formData.date_time,
          location_address: formData.location_address,
          theme: formData.theme,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
          is_guest_list_public: formData.is_guest_list_public,
          is_comments_enabled: formData.is_comments_enabled,
          host_id: user.id,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      router.push(`/events/${data.id}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
        <div style={{ fontSize: '4rem' }}>🔒</div>
        <h2 style={{ color: 'var(--color-text-light)', textAlign: 'center' }}>Sign in to create events</h2>
        <Link href="/auth/signin" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textDecoration: 'none' }}>
            Party Time Africa
          </Link>
          <Link href="/events" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>Cancel</Link>
        </div>
      </nav>

      {/* Form Container */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-accent)', textAlign: 'center', marginBottom: '0.5rem' }}>
          Create Your Event
        </h1>
        <p style={{ color: 'var(--color-text-dark)', textAlign: 'center', marginBottom: '2rem' }}>
          Fill in the details below to create an unforgettable experience.
        </p>

        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: '80px', height: '4px', borderRadius: '2px',
              backgroundColor: step >= s ? 'var(--color-accent)' : 'var(--color-border)',
              transition: 'background-color 0.3s'
            }} />
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-error)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-error)' }}>
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="card">
            <h2 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Event Details</h2>

            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Afro Beats Night" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell people what your event is about..." className="form-textarea" rows={4} />
            </div>

            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input type="datetime-local" name="date_time" value={formData.date_time} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input type="text" name="location_address" value={formData.location_address} onChange={handleChange} placeholder="e.g., Cayenne Bar, Kampala" className="form-input" />
            </div>

            <button onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Next: Theme & Settings →
            </button>
          </div>
        )}

        {/* Step 2: Theme & Settings */}
        {step === 2 && (
          <div className="card">
            <h2 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Theme & Settings</h2>

            <div className="form-group">
              <label className="form-label">Event Theme</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                    className={`theme-${theme.id}`}
                    style={{
                      padding: '1rem 0.5rem', borderRadius: '0.5rem', textAlign: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer',
                      border: formData.theme === theme.id ? '3px solid var(--color-accent)' : '3px solid transparent',
                      transition: 'border-color 0.3s'
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Max Capacity</label>
              <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleChange} placeholder="Leave empty for unlimited" className="form-input" />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="is_guest_list_public" checked={formData.is_guest_list_public} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: 'var(--color-accent)' }} />
                <span className="form-label" style={{ marginBottom: 0 }}>Public Guest List</span>
              </label>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" name="is_comments_enabled" checked={formData.is_comments_enabled} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: 'var(--color-accent)' }} />
                <span className="form-label" style={{ marginBottom: 0 }}>Enable Comments</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
              <button type="button" onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 1 }}>Next: Preview →</button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Submit */}
        {step === 3 && (
          <div className="card">
            <h2 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Preview & Create</h2>

            {/* Preview Card */}
            <div style={{ backgroundColor: 'var(--color-secondary)', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
              <div className={`theme-${formData.theme}`} style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <span style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {THEMES.find(t => t.id === formData.theme)?.name || 'Party'}
                </span>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>{formData.title || 'Your Event Title'}</h3>
                <p style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  📅 {formData.date_time ? new Date(formData.date_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'}
                </p>
                <p style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  📍 {formData.location_address || 'Location TBD'}
                </p>
                <p style={{ color: 'var(--color-text-dark)', fontSize: '0.85rem' }}>
                  {formData.description || 'No description yet.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setStep(2)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Creating...' : '🚀 Create Event'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-dark)' }}>© 2026 Party Time Africa. All rights reserved.</p>
      </footer>
    </div>
  );
}
