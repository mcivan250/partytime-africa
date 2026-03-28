'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AffiliateGoldDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalReferrals: 0,
    totalEarnings: 0,
    rank: 'Rising Star',
    recentRewards: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAffiliateStats = async () => {
      try {
        // Fetch party points
        const { data: pointsData } = await supabase
          .from('party_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Fetch affiliate rewards
        const { data: rewardsData } = await supabase
          .from('affiliate_rewards')
          .select('*')
          .eq('affiliate_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setStats({
          totalPoints: pointsData?.balance || 0,
          totalReferrals: rewardsData?.length || 0,
          totalEarnings: (rewardsData?.length || 0) * 100,
          rank: (rewardsData?.length || 0) > 50 ? 'Platinum' : (rewardsData?.length || 0) > 20 ? 'Gold' : 'Rising Star',
          recentRewards: rewardsData || [],
        });
      } catch (error) {
        console.error('Error fetching affiliate stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateStats();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-text-light text-xl font-display">Please sign in to view your affiliate dashboard</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-text-light text-xl font-display">Loading your gold partner dashboard...</div>
      </div>
    );
  }

  const getRankBadge = (rank: string) => {
    const badges: { [key: string]: string } = {
      'Platinum': '👑',
      'Gold': '🥇',
      'Silver': '🥈',
      'Rising Star': '⭐',
    };
    return badges[rank] || '⭐';
  };

  return (
    <div className="min-h-screen bg-primary text-text-light">
      {/* Navigation */}
      <nav className="bg-secondary border-b border-border sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-display font-bold text-accent">
            Gold Partner Dashboard
          </div>
          <button className="btn btn-secondary px-6 py-2">Sign Out</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-secondary border-b border-border py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-display font-bold mb-2">Welcome Back!</h1>
              <p className="text-text-dark text-lg">Your affiliate rewards are waiting.</p>
            </div>
            <div className="text-7xl">{getRankBadge(stats.rank)}</div>
          </div>

          {/* Rank Badge */}
          <div className="inline-block bg-primary border border-accent rounded-full px-6 py-3">
            <span className="text-accent font-bold text-lg">{stats.rank} Partner</span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Total Points */}
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-text-dark text-sm mb-2">Party Points Balance</p>
            <p className="text-4xl font-bold text-accent">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-text-dark text-xs mt-2">{Math.floor(stats.totalPoints / 100)} × $1 codes</p>
          </div>

          {/* Total Referrals */}
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🎫</div>
            <p className="text-text-dark text-sm mb-2">Successful Referrals</p>
            <p className="text-4xl font-bold text-accent">{stats.totalReferrals}</p>
            <p className="text-text-dark text-xs mt-2">Tickets sold via your links</p>
          </div>

          {/* Total Earnings */}
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">💵</div>
            <p className="text-text-dark text-sm mb-2">Estimated Earnings</p>
            <p className="text-4xl font-bold text-accent">${(stats.totalEarnings / 100).toLocaleString()}</p>
            <p className="text-text-dark text-xs mt-2">At $1 per 100 points</p>
          </div>

          {/* Rank */}
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">{getRankBadge(stats.rank)}</div>
            <p className="text-text-dark text-sm mb-2">Your Rank</p>
            <p className="text-4xl font-bold text-accent">{stats.rank}</p>
            <p className="text-text-dark text-xs mt-2">Keep promoting to level up!</p>
          </div>
        </div>
      </section>

      {/* Redemption Section */}
      <section className="bg-secondary border-y border-border py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-8">Redeem Your Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-8">
              <div className="text-3xl font-bold text-accent mb-4">100 Points</div>
              <p className="text-text-light mb-4">Get a $1 discount code for any event</p>
              <button className="btn btn-primary w-full py-3">
                Redeem Now
              </button>
            </div>

            <div className="card p-8">
              <div className="text-3xl font-bold text-accent mb-4">500 Points</div>
              <p className="text-text-light mb-4">Get a $5 discount code + exclusive badge</p>
              <button className="btn btn-primary w-full py-3">
                Redeem Now
              </button>
            </div>

            <div className="card p-8">
              <div className="text-3xl font-bold text-accent mb-4">1000 Points</div>
              <p className="text-text-light mb-4">Get a $10 discount code + VIP status</p>
              <button className="btn btn-primary w-full py-3">
                Redeem Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Rewards */}
      <section className="container max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-display font-bold mb-8">Recent Referral Rewards</h2>
        <div className="space-y-4">
          {stats.recentRewards.length > 0 ? (
            stats.recentRewards.map((reward: any) => (
              <div key={reward.id} className="card p-6 flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">{reward.event_name || 'Event'}</p>
                  <p className="text-text-dark text-sm">
                    Referred by: {reward.referred_user_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">+100</p>
                  <p className="text-text-dark text-xs">
                    {new Date(reward.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-8 text-center">
              <p className="text-text-dark text-lg">
                No referral rewards yet. Start sharing your affiliate links to earn!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Promotion Tips */}
      <section className="bg-secondary border-t border-border py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-8">Promotion Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-4">🎯 Share Event Moments</h3>
              <p className="text-text-dark mb-4">
                Every time you share an event moment with your affiliate link, you're earning potential referrals. 
                The more you share, the more you earn!
              </p>
            </div>

            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-4">📱 Use Social Media</h3>
              <p className="text-text-dark mb-4">
                Post your affiliate links on WhatsApp, Instagram, and Twitter. Your network is your net worth!
              </p>
            </div>

            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-4">🏆 Climb the Leaderboard</h3>
              <p className="text-text-dark mb-4">
                Top affiliates get featured on our leaderboard and unlock exclusive perks and bonuses.
              </p>
            </div>

            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-4">💎 Unlock VIP Status</h3>
              <p className="text-text-dark mb-4">
                Reach Platinum status and get early access to exclusive events, special discounts, and more!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
