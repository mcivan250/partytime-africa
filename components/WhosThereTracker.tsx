import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AttendeeProfile {
  id: string;
  name: string;
  avatar_url?: string;
  status: 'arrived' | 'on-way' | 'interested';
  arrivedAt?: string;
  vibe?: string;
}

interface VibeMetrics {
  totalAttendees: number;
  arrivedCount: number;
  onWayCount: number;
  interestedCount: number;
  vibeScore: number;
  topVibes: { label: string; count: number }[];
}

interface WhosThereTrackerProps {
  eventId: string;
}

export default function WhosThereTracker({ eventId }: WhosThereTrackerProps) {
  const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
  const [metrics, setMetrics] = useState<VibeMetrics | null>(null);
  const [userStatus, setUserStatus] = useState<'arrived' | 'on-way' | 'interested'>('interested');
  const [loading, setLoading] = useState(true);
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    fetchAttendees();
    const interval = setInterval(fetchAttendees, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('arrived_at', { ascending: false });

      if (error) throw error;

      const transformedData: AttendeeProfile[] = (data || []).map((attendee) => ({
        id: attendee.id,
        name: attendee.name || 'Anonymous',
        avatar_url: attendee.avatar_url,
        status: attendee.status || 'interested',
        arrivedAt: attendee.arrived_at,
        vibe: attendee.vibe,
      }));

      setAttendees(transformedData);

      // Calculate metrics
      const arrived = transformedData.filter((a) => a.status === 'arrived').length;
      const onWay = transformedData.filter((a) => a.status === 'on-way').length;
      const interested = transformedData.filter((a) => a.status === 'interested').length;

      const vibeScore = Math.min(100, arrived * 10 + onWay * 5);

      const vibeMap: Record<string, number> = {};
      transformedData.forEach((a) => {
        if (a.vibe) {
          vibeMap[a.vibe] = (vibeMap[a.vibe] || 0) + 1;
        }
      });

      const topVibes = Object.entries(vibeMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setMetrics({
        totalAttendees: transformedData.length,
        arrivedCount: arrived,
        onWayCount: onWay,
        interestedCount: interested,
        vibeScore,
        topVibes,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setLoading(false);
    }
  };

  const updateUserStatus = async (status: 'arrived' | 'on-way' | 'interested') => {
    setUserStatus(status);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user) return;

      await supabase.from('event_attendees').upsert({
        event_id: eventId,
        user_id: data.session.user.id,
        status,
        arrived_at: status === 'arrived' ? new Date().toISOString() : null,
      });

      fetchAttendees();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-2"></div>
          <p className="text-text-dark text-sm">Loading vibe...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="w-full bg-secondary rounded-2xl border border-border p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-text-light mb-2">🔥 Who's There</h2>
        <p className="text-text-dark text-sm">Real-time attendance and vibe tracking</p>
      </div>

      {/* Vibe Score */}
      <div className="bg-primary rounded-xl p-6 border border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-text-light font-semibold">Current Vibe Score</span>
          <span className="text-3xl font-bold text-accent">{metrics.vibeScore}/100</span>
        </div>
        <div className="w-full bg-border rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent via-accent to-accent/50 transition-all duration-500"
            style={{ width: `${metrics.vibeScore}%` }}
          ></div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary rounded-xl p-4 border border-border text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-text-dark text-xs mb-1">Arrived</p>
          <p className="text-2xl font-bold text-accent">{metrics.arrivedCount}</p>
        </div>
        <div className="bg-primary rounded-xl p-4 border border-border text-center">
          <div className="text-3xl mb-2">🚗</div>
          <p className="text-text-dark text-xs mb-1">On The Way</p>
          <p className="text-2xl font-bold text-accent">{metrics.onWayCount}</p>
        </div>
        <div className="bg-primary rounded-xl p-4 border border-border text-center">
          <div className="text-3xl mb-2">💭</div>
          <p className="text-text-dark text-xs mb-1">Interested</p>
          <p className="text-2xl font-bold text-accent">{metrics.interestedCount}</p>
        </div>
      </div>

      {/* User Status Selector */}
      <div>
        <p className="text-text-light font-semibold mb-3">Your Status</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => updateUserStatus('arrived')}
            className={`p-3 rounded-lg font-semibold transition-all ${
              userStatus === 'arrived'
                ? 'bg-accent text-primary'
                : 'bg-border text-text-light hover:bg-border/80'
            }`}
          >
            ✅ Arrived
          </button>
          <button
            onClick={() => updateUserStatus('on-way')}
            className={`p-3 rounded-lg font-semibold transition-all ${
              userStatus === 'on-way'
                ? 'bg-accent text-primary'
                : 'bg-border text-text-light hover:bg-border/80'
            }`}
          >
            🚗 On Way
          </button>
          <button
            onClick={() => updateUserStatus('interested')}
            className={`p-3 rounded-lg font-semibold transition-all ${
              userStatus === 'interested'
                ? 'bg-accent text-primary'
                : 'bg-border text-text-light hover:bg-border/80'
            }`}
          >
            💭 Interested
          </button>
        </div>
      </div>

      {/* Top Vibes */}
      {metrics.topVibes.length > 0 && (
        <div>
          <p className="text-text-light font-semibold mb-3">Top Vibes</p>
          <div className="space-y-2">
            {metrics.topVibes.map((vibe, idx) => (
              <div key={idx} className="flex items-center justify-between bg-primary rounded-lg p-3 border border-border">
                <span className="text-text-light font-semibold">{vibe.label}</span>
                <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-bold">
                  {vibe.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendees List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-text-light font-semibold">Recent Arrivals</p>
          <button
            onClick={() => setShowFullList(!showFullList)}
            className="text-accent text-sm font-semibold hover:underline"
          >
            {showFullList ? 'Show Less' : 'Show All'}
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {attendees.slice(0, showFullList ? undefined : 5).map((attendee) => (
            <div key={attendee.id} className="flex items-center justify-between bg-primary rounded-lg p-3 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-primary font-bold">
                  {attendee.avatar_url ? (
                    <img src={attendee.avatar_url} alt={attendee.name} className="w-full h-full rounded-full" />
                  ) : (
                    attendee.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-text-light font-semibold text-sm">{attendee.name}</p>
                  {attendee.vibe && <p className="text-text-dark text-xs">{attendee.vibe}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {attendee.status === 'arrived' && <span className="text-lg">✅</span>}
                {attendee.status === 'on-way' && <span className="text-lg">🚗</span>}
                {attendee.status === 'interested' && <span className="text-lg">💭</span>}
              </div>
            </div>
          ))}
        </div>

        {attendees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-dark text-sm">Be the first to arrive! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
