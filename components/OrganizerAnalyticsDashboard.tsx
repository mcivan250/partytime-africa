'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  totalTickets: number;
  checkedInCount: number;
  pendingCheckIns: number;
  checkInRate: number;
  momentShares: number;
  totalEngagement: number;
  topMoments: Array<{
    id: string;
    caption: string;
    likes_count: number;
    comments_count: number;
  }>;
  checkInTimeline: Array<{
    time: string;
    count: number;
  }>;
  guestDemographics: {
    totalGuests: number;
    newGuests: number;
    returningGuests: number;
  };
}

interface OrganizerAnalyticsDashboardProps {
  eventId: string;
}

export default function OrganizerAnalyticsDashboard({
  eventId,
}: OrganizerAnalyticsDashboardProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'checkins' | 'engagement' | 'guests'>(
    'checkins'
  );

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [eventId, user]);

  const loadAnalytics = async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      // Verify user is event organizer
      const { data: event } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      if (!event || event.organizer_id !== user.id) {
        console.error('Unauthorized');
        setRefreshing(false);
        return;
      }

      // Get ticket statistics
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('event_id', eventId);

      const { data: checkins, error: checkinsError } = await supabase
        .from('ticket_checkins')
        .select('id, checked_in_at')
        .eq('event_id', eventId);

      // Get moment statistics
      const { data: moments, error: momentsError } = await supabase
        .from('event_moments')
        .select(
          `
          id,
          caption,
          moment_likes(count),
          moment_comments(count)
        `
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get guest statistics
      const { data: rsvps, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('id, user_id, created_at')
        .eq('event_id', eventId);

      // Calculate check-in timeline (group by hour)
      const timeline: { [key: string]: number } = {};
      checkins?.forEach((checkin: any) => {
        const hour = new Date(checkin.checked_in_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        timeline[hour] = (timeline[hour] || 0) + 1;
      });

      const checkInTimeline = Object.entries(timeline)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => a.time.localeCompare(b.time));

      // Calculate guest demographics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newGuests = rsvps?.filter((rsvp: any) => {
        return new Date(rsvp.created_at) > thirtyDaysAgo;
      }).length || 0;

      const returningGuests = (rsvps?.length || 0) - newGuests;

      const data: AnalyticsData = {
        totalTickets: tickets?.length || 0,
        checkedInCount: checkins?.length || 0,
        pendingCheckIns: (tickets?.length || 0) - (checkins?.length || 0),
        checkInRate: tickets?.length ? ((checkins?.length || 0) / tickets.length) * 100 : 0,
        momentShares: moments?.length || 0,
        totalEngagement:
          (moments?.reduce((sum: number, m: any) => {
            return sum + (m.moment_likes?.[0]?.count || 0) + (m.moment_comments?.[0]?.count || 0);
          }, 0) || 0),
        topMoments: moments?.map((m: any) => ({
          id: m.id,
          caption: m.caption,
          likes_count: m.moment_likes?.[0]?.count || 0,
          comments_count: m.moment_comments?.[0]?.count || 0,
        })) || [],
        checkInTimeline,
        guestDemographics: {
          totalGuests: rsvps?.length || 0,
          newGuests,
          returningGuests,
        },
      };

      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }

    setRefreshing(false);
  };

  if (loading) {
    return <div className="analytics-dashboard loading">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="analytics-dashboard error">Unable to load analytics</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Event Analytics</h2>
        <button
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={loadAnalytics}
          disabled={refreshing}
        >
          {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">🎫</span>
          <div className="metric-content">
            <span className="metric-label">Total Tickets</span>
            <span className="metric-value">{analytics.totalTickets}</span>
          </div>
        </div>

        <div className="metric-card highlight">
          <span className="metric-icon">✅</span>
          <div className="metric-content">
            <span className="metric-label">Checked In</span>
            <span className="metric-value">{analytics.checkedInCount}</span>
            <span className="metric-subtext">{analytics.checkInRate.toFixed(1)}% rate</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">⏳</span>
          <div className="metric-content">
            <span className="metric-label">Pending</span>
            <span className="metric-value">{analytics.pendingCheckIns}</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">📸</span>
          <div className="metric-content">
            <span className="metric-label">Moments Shared</span>
            <span className="metric-value">{analytics.momentShares}</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">💬</span>
          <div className="metric-content">
            <span className="metric-label">Total Engagement</span>
            <span className="metric-value">{analytics.totalEngagement}</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">👥</span>
          <div className="metric-content">
            <span className="metric-label">Total Guests</span>
            <span className="metric-value">{analytics.guestDemographics.totalGuests}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button
          className={`tab ${selectedMetric === 'checkins' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('checkins')}
        >
          Check-in Timeline
        </button>
        <button
          className={`tab ${selectedMetric === 'engagement' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('engagement')}
        >
          Top Moments
        </button>
        <button
          className={`tab ${selectedMetric === 'guests' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('guests')}
        >
          Guest Demographics
        </button>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {selectedMetric === 'checkins' && (
          <div className="timeline-section">
            <h3>Check-in Timeline</h3>
            {analytics.checkInTimeline.length > 0 ? (
              <div className="timeline-chart">
                {analytics.checkInTimeline.map((entry) => (
                  <div key={entry.time} className="timeline-entry">
                    <span className="time">{entry.time}</span>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${(entry.count / Math.max(...analytics.checkInTimeline.map((e) => e.count))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="count">{entry.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No check-ins yet</p>
            )}
          </div>
        )}

        {selectedMetric === 'engagement' && (
          <div className="moments-section">
            <h3>Top Moments</h3>
            {analytics.topMoments.length > 0 ? (
              <div className="moments-list">
                {analytics.topMoments.map((moment) => (
                  <div key={moment.id} className="moment-item">
                    <p className="moment-caption">{moment.caption || 'Untitled moment'}</p>
                    <div className="engagement-stats">
                      <span>❤️ {moment.likes_count}</span>
                      <span>💬 {moment.comments_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No moments shared yet</p>
            )}
          </div>
        )}

        {selectedMetric === 'guests' && (
          <div className="demographics-section">
            <h3>Guest Demographics</h3>
            <div className="demographics-cards">
              <div className="demo-card">
                <span className="demo-icon">👥</span>
                <span className="demo-label">Total Guests</span>
                <span className="demo-value">
                  {analytics.guestDemographics.totalGuests}
                </span>
              </div>
              <div className="demo-card highlight">
                <span className="demo-icon">✨</span>
                <span className="demo-label">New Guests</span>
                <span className="demo-value">
                  {analytics.guestDemographics.newGuests}
                </span>
              </div>
              <div className="demo-card">
                <span className="demo-icon">🔄</span>
                <span className="demo-label">Returning Guests</span>
                <span className="demo-value">
                  {analytics.guestDemographics.returningGuests}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
