'use client';

import React, { useEffect, useState } from 'react';
import { getTopAffiliates } from '@/lib/affiliate-moments';
import { supabase } from '@/lib/supabase';

interface TopAffiliate {
  user_id: string;
  referral_count: number;
  total_rewards: number;
  user_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

interface AffiliateLeaderboardProps {
  limit?: number;
  compact?: boolean;
}

export default function AffiliateLeaderboard({
  limit = 10,
  compact = false,
}: AffiliateLeaderboardProps) {
  const [affiliates, setAffiliates] = useState<TopAffiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getTopAffiliates(limit);

    // Fetch user profiles for each affiliate
    const enrichedData = await Promise.all(
      data.map(async (affiliate) => {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('id', affiliate.user_id)
          .single();

        return {
          ...affiliate,
          user_profile: profile,
        };
      })
    );

    setAffiliates(enrichedData);
    setLoading(false);
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getTierBadge = (rewards: number) => {
    if (rewards >= 10000) return { label: 'Platinum', color: '#e5e4e2' };
    if (rewards >= 5000) return { label: 'Gold', color: '#ffd700' };
    if (rewards >= 2000) return { label: 'Silver', color: '#c0c0c0' };
    if (rewards >= 500) return { label: 'Bronze', color: '#cd7f32' };
    return { label: 'Rising', color: '#ff6b6b' };
  };

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }

  if (affiliates.length === 0) {
    return (
      <div className="leaderboard-empty">
        <p>No top affiliates yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className={`affiliate-leaderboard ${compact ? 'compact' : ''}`}>
      <div className="leaderboard-header">
        <h3>🏆 Top Affiliates</h3>
        <p className="subtitle">Earn rewards by sharing Moments</p>
      </div>

      <div className="leaderboard-list">
        {affiliates.map((affiliate, index) => {
          const tier = getTierBadge(affiliate.total_rewards);
          const displayName = affiliate.user_profile?.display_name || 'Anonymous';
          const avatarUrl = affiliate.user_profile?.avatar_url;

          return (
            <div key={affiliate.user_id} className="leaderboard-item">
              <div className="rank-badge">{getMedalEmoji(index + 1)}</div>

              <div className="affiliate-info">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="avatar"
                  />
                )}
                <div className="name-and-tier">
                  <span className="name">{displayName}</span>
                  <span
                    className="tier-badge"
                    style={{ backgroundColor: tier.color }}
                  >
                    {tier.label}
                  </span>
                </div>
              </div>

              <div className="stats">
                <div className="stat">
                  <span className="label">Referrals</span>
                  <span className="value">{affiliate.referral_count}</span>
                </div>
                <div className="stat">
                  <span className="label">Rewards</span>
                  <span className="value">{Math.floor(affiliate.total_rewards)}</span>
                </div>
              </div>

              {index === 0 && <div className="crown-icon">👑</div>}
            </div>
          );
        })}
      </div>

      <div className="leaderboard-footer">
        <p>🎯 Climb the leaderboard by sharing your favorite Moments!</p>
      </div>
    </div>
  );
}
