'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralList: Array<{
    id: string;
    referredUserName: string;
    referredUserEmail: string;
    eventName: string;
    ticketPrice: number;
    commission: number;
    status: 'pending' | 'completed' | 'paid';
    createdAt: string;
  }>;
  commissionRate: number;
}

export default function ReferralSystem({ eventId, userId }: { eventId?: string; userId?: string }) {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user, eventId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // Get or create referral code
      const { data: referralProfile, error: profileError } = await supabase
        .from('referral_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      let referralCode = referralProfile?.referral_code;

      if (!referralCode) {
        // Generate new referral code
        referralCode = `PT${user?.id?.substring(0, 8).toUpperCase()}${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`;

        const { error: insertError } = await supabase
          .from('referral_profiles')
          .insert({
            user_id: user?.id,
            referral_code: referralCode,
            commission_rate: 10,
          });

        if (insertError && insertError.code !== '23505') throw insertError;
      }

      // Fetch referral transactions
      const { data: referrals, error: referralsError } = await supabase
        .from('referral_transactions')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      const totalReferrals = referrals?.length || 0;
      const totalEarnings = referrals
        ?.filter((r) => r.status === 'paid')
        .reduce((sum, r) => sum + r.commission_amount, 0) || 0;
      const pendingEarnings = referrals
        ?.filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.commission_amount, 0) || 0;

      const referralList = (referrals || []).map((r) => ({
        id: r.id,
        referredUserName: r.referred_user_name,
        referredUserEmail: r.referred_user_email,
        eventName: r.event_name,
        ticketPrice: r.ticket_price,
        commission: r.commission_amount,
        status: r.status,
        createdAt: r.created_at,
      }));

      setReferralData({
        referralCode,
        totalReferrals,
        totalEarnings,
        pendingEarnings,
        referralList,
        commissionRate: referralProfile?.commission_rate || 10,
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralData) return;

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    if (!referralData) return;

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}?ref=${referralData.referralCode}`;
    const message = `Join me at this amazing event! Use my referral link to get special benefits: ${referralLink}`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    };

    window.open(urls[platform], '_blank');
  };

  if (loading) {
    return <div className="text-center py-8">Loading referral data...</div>;
  }

  if (!referralData) {
    return <div className="text-center py-8 text-text-dark">No referral data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Section */}
      <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-6 border border-accent/30 space-y-4">
        <h2 className="text-2xl font-bold text-text-light">Earn with Referrals</h2>
        <p className="text-text-dark">
          Share your unique referral code and earn {referralData.commissionRate}% commission on every ticket sold!
        </p>

        {/* Referral Code Display */}
        <div className="bg-primary rounded-lg p-4 border border-border/30 space-y-3">
          <p className="text-sm text-text-dark">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-secondary rounded px-4 py-3 text-accent font-mono font-bold">
              {referralData.referralCode}
            </code>
            <button
              onClick={copyReferralLink}
              className="px-4 py-3 bg-accent text-primary rounded-lg font-semibold hover:bg-accent/90 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => shareOnSocial('whatsapp')}
            className="bg-green-500/10 border border-green-500/30 text-green-400 py-2 rounded-lg font-semibold hover:bg-green-500/20 transition-colors"
          >
            💬 WhatsApp
          </button>
          <button
            onClick={() => shareOnSocial('facebook')}
            className="bg-blue-500/10 border border-blue-500/30 text-blue-400 py-2 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors"
          >
            f Facebook
          </button>
          <button
            onClick={() => shareOnSocial('twitter')}
            className="bg-sky-500/10 border border-sky-500/30 text-sky-400 py-2 rounded-lg font-semibold hover:bg-sky-500/20 transition-colors"
          >
            𝕏 Twitter
          </button>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary rounded-lg p-6 border border-border/30 text-center">
          <p className="text-text-dark text-sm mb-2">Total Referrals</p>
          <p className="text-4xl font-bold text-accent">{referralData.totalReferrals}</p>
        </div>

        <div className="bg-primary rounded-lg p-6 border border-border/30 text-center">
          <p className="text-text-dark text-sm mb-2">Pending Earnings</p>
          <p className="text-4xl font-bold text-yellow-400">
            {referralData.pendingEarnings.toLocaleString()} UGX
          </p>
        </div>

        <div className="bg-primary rounded-lg p-6 border border-border/30 text-center">
          <p className="text-text-dark text-sm mb-2">Total Paid Out</p>
          <p className="text-4xl font-bold text-green-400">
            {referralData.totalEarnings.toLocaleString()} UGX
          </p>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-primary rounded-lg p-6 border border-border/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-light">Referral History</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-accent hover:underline text-sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {referralData.referralList.length === 0 ? (
          <div className="text-center py-8 text-text-dark">
            <p className="text-4xl mb-2">📊</p>
            <p>No referrals yet. Start sharing your code!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {referralData.referralList.map((referral) => (
              <div
                key={referral.id}
                className="bg-secondary rounded-lg p-4 border border-border/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-light">{referral.referredUserName}</p>
                    <p className="text-sm text-text-dark">{referral.referredUserEmail}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      referral.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : referral.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {referral.status.toUpperCase()}
                  </span>
                </div>

                {showDetails && (
                  <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t border-border/30">
                    <div>
                      <p className="text-text-dark">Event</p>
                      <p className="text-text-light font-semibold">{referral.eventName}</p>
                    </div>
                    <div>
                      <p className="text-text-dark">Ticket Price</p>
                      <p className="text-text-light font-semibold">{referral.ticketPrice.toLocaleString()} UGX</p>
                    </div>
                    <div>
                      <p className="text-text-dark">Commission</p>
                      <p className="text-accent font-semibold">+{referral.commission.toLocaleString()} UGX</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-text-dark">
                  {new Date(referral.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Information */}
      <div className="bg-primary rounded-lg p-6 border border-border/30 space-y-3">
        <h3 className="text-lg font-bold text-text-light">Payout Information</h3>
        <div className="space-y-2 text-sm">
          <p className="text-text-dark">
            <span className="font-semibold">Commission Rate:</span> {referralData.commissionRate}% per ticket
          </p>
          <p className="text-text-dark">
            <span className="font-semibold">Minimum Payout:</span> 50,000 UGX
          </p>
          <p className="text-text-dark">
            <span className="font-semibold">Payout Schedule:</span> Monthly on the 1st
          </p>
          <p className="text-text-dark">
            <span className="font-semibold">Payment Method:</span> Mobile Money / Bank Transfer
          </p>
        </div>

        {referralData.pendingEarnings >= 50000 && (
          <button className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors mt-4">
            💰 Request Payout
          </button>
        )}
      </div>
    </div>
  );
}
