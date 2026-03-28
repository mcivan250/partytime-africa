'use client';

import React, { useEffect, useState } from 'react';
import { getUserAffiliateRewards, claimAffiliateReward, AffiliateReward } from '@/lib/affiliate-moments';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/afrocentric-theme.css';

interface AffiliateRewardsCardProps {
  momentId?: string;
  compact?: boolean;
}

export default function AffiliateRewardsCard({
  momentId,
  compact = false,
}: AffiliateRewardsCardProps) {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<AffiliateReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'claimed'>('pending');

  useEffect(() => {
    if (!user) return;
    loadRewards();
  }, [user, filter]);

  const loadRewards = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserAffiliateRewards(
      user.id,
      filter === 'all' ? undefined : filter
    );
    setRewards(data);
    setLoading(false);
  };

  const handleClaimReward = async (rewardId: string) => {
    setClaiming(rewardId);
    const success = await claimAffiliateReward(rewardId);
    if (success) {
      await loadRewards();
    }
    setClaiming(null);
  };

  const pendingRewards = rewards.filter((r) => r.status === 'pending');
  const claimedRewards = rewards.filter((r) => r.status === 'claimed');
  const totalEarned = rewards.reduce((sum, r) => sum + r.reward_value, 0);

  if (!user) {
    return (
      <div className="affiliate-card affiliate-card-empty">
        <p>Sign in to view your affiliate rewards</p>
      </div>
    );
  }

  if (compact && pendingRewards.length === 0) {
    return null;
  }

  return (
    <div className={`affiliate-card ${compact ? 'compact' : ''}`}>
      <div className="affiliate-card-header">
        <h3>🎉 Your Affiliate Rewards</h3>
        <div className="affiliate-stats">
          <div className="stat">
            <span className="label">Total Earned</span>
            <span className="value">{totalEarned}</span>
          </div>
          <div className="stat">
            <span className="label">Pending</span>
            <span className="value pending">{pendingRewards.length}</span>
          </div>
          <div className="stat">
            <span className="label">Claimed</span>
            <span className="value claimed">{claimedRewards.length}</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="filter-tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingRewards.length})
          </button>
          <button
            className={`tab ${filter === 'claimed' ? 'active' : ''}`}
            onClick={() => setFilter('claimed')}
          >
            Claimed ({claimedRewards.length})
          </button>
        </div>
      )}

      <div className="rewards-list">
        {loading ? (
          <div className="loading">Loading rewards...</div>
        ) : rewards.length === 0 ? (
          <div className="empty-state">
            <p>No {filter === 'all' ? '' : filter} rewards yet</p>
            <small>Share your favorite Moments to earn Party Points!</small>
          </div>
        ) : (
          rewards.map((reward) => (
            <div
              key={reward.id}
              className={`reward-item ${reward.status}`}
            >
              <div className="reward-info">
                <div className="reward-header">
                  <span className="reward-type">
                    {reward.reward_type === 'party_points' && '⭐ Party Points'}
                    {reward.reward_type === 'discount_code' && '🎟️ Discount Code'}
                    {reward.reward_type === 'cash_kickback' && '💰 Cash Kickback'}
                  </span>
                  <span className={`status-badge ${reward.status}`}>
                    {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                  </span>
                </div>
                <p className="reward-description">
                  Someone bought a ticket after seeing your Moment!
                </p>
                <div className="reward-meta">
                  <span className="date">
                    {new Date(reward.created_at).toLocaleDateString()}
                  </span>
                  {reward.expires_at && (
                    <span className="expiry">
                      Expires: {new Date(reward.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="reward-value">
                <span className="amount">{reward.reward_value}</span>
                <span className="unit">
                  {reward.reward_type === 'party_points' ? 'PTS' : reward.reward_currency}
                </span>
              </div>

              {reward.status === 'pending' && (
                <button
                  className="claim-btn"
                  onClick={() => handleClaimReward(reward.id)}
                  disabled={claiming === reward.id}
                >
                  {claiming === reward.id ? 'Claiming...' : 'Claim'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!compact && pendingRewards.length > 0 && (
        <div className="affiliate-cta">
          <p>💡 Tip: Share more Moments to earn more rewards!</p>
        </div>
      )}
    </div>
  );
}
