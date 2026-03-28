/**
 * Affiliate Moments System
 * Reward users for sharing Event Moments that lead to ticket sales
 */

import { supabase } from './supabase';

export interface AffiliateReward {
  id: string;
  moment_id: string;
  user_id: string;
  ticket_buyer_id: string;
  event_id: string;
  reward_type: 'party_points' | 'discount_code' | 'cash_kickback';
  reward_value: number;
  reward_currency?: string;
  status: 'pending' | 'claimed' | 'expired';
  created_at: string;
  claimed_at?: string;
  expires_at: string;
}

export interface PartyPoints {
  user_id: string;
  total_points: number;
  available_points: number;
  redeemed_points: number;
  updated_at: string;
}

/**
 * Generate unique affiliate link for a Moment
 */
export function generateAffiliateLink(momentId: string, userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.partytime.africa';
  const params = new URLSearchParams({
    moment_id: momentId,
    ref: userId,
    utm_source: 'moment',
    utm_medium: 'social',
  } );
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Track when a ticket is purchased via an affiliate link
 */
export async function trackAffiliateTicketSale(
  momentId: string,
  ticketBuyerId: string,
  eventId: string
): Promise<AffiliateReward | null> {
  try {
    // Get the Moment to find the original poster
    const { data: moment, error: momentError } = await supabase
      .from('event_moments')
      .select('user_id')
      .eq('id', momentId)
      .single();

    if (momentError || !moment) {
      console.error('Moment not found:', momentError);
      return null;
    }

    // Create affiliate reward record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiry

    const { data: reward, error: rewardError } = await supabase
      .from('affiliate_rewards')
      .insert([
        {
          moment_id: momentId,
          user_id: moment.user_id,
          ticket_buyer_id: ticketBuyerId,
          event_id: eventId,
          reward_type: 'party_points',
          reward_value: 100, // 100 Party Points per successful referral
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (rewardError) {
      console.error('Error creating affiliate reward:', rewardError);
      return null;
    }

    // Update user's Party Points
    await addPartyPoints(moment.user_id, 100, 'affiliate_moment_sale');

    return reward;
  } catch (error) {
    console.error('Error tracking affiliate sale:', error);
    return null;
  }
}

/**
 * Add Party Points to a user's account
 */
export async function addPartyPoints(
  userId: string,
  points: number,
  reason: string
): Promise<PartyPoints | null> {
  try {
    // Get or create user's Party Points record
    const { data: existing } = await supabase
      .from('party_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('party_points')
        .update({
          total_points: (existing.total_points || 0) + points,
          available_points: (existing.available_points || 0) + points,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } else {
      const { data: created, error } = await supabase
        .from('party_points')
        .insert([
          {
            user_id: userId,
            total_points: points,
            available_points: points,
            redeemed_points: 0,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return created;
    }
  } catch (error) {
    console.error('Error adding Party Points:', error);
    return null;
  }
}

/**
 * Get user's Party Points balance
 */
export async function getUserPartyPoints(userId: string): Promise<PartyPoints | null> {
  try {
    const { data, error } = await supabase
      .from('party_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is okay
      console.error('Error fetching Party Points:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting Party Points:', error);
    return null;
  }
}

/**
 * Redeem Party Points for a discount code
 */
export async function redeemPartyPoints(
  userId: string,
  pointsToRedeem: number
): Promise<{ discountCode: string; discountAmount: number } | null> {
  try {
    const userPoints = await getUserPartyPoints(userId);

    if (!userPoints || userPoints.available_points < pointsToRedeem) {
      console.error('Insufficient Party Points');
      return null;
    }

    // Generate discount code (100 points = $1 discount)
    const discountAmount = pointsToRedeem / 100;
    const discountCode = `PARTY${Date.now().toString(36).toUpperCase()}`;

    // Update user's Party Points
    const { error: updateError } = await supabase
      .from('party_points')
      .update({
        available_points: userPoints.available_points - pointsToRedeem,
        redeemed_points: userPoints.redeemed_points + pointsToRedeem,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Create discount code record
    await supabase.from('discount_codes').insert([
      {
        code: discountCode,
        user_id: userId,
        discount_amount: discountAmount,
        discount_type: 'fixed',
        max_uses: 1,
        used_count: 0,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      },
    ]);

    return { discountCode, discountAmount };
  } catch (error) {
    console.error('Error redeeming Party Points:', error);
    return null;
  }
}

/**
 * Get affiliate rewards for a user
 */
export async function getUserAffiliateRewards(
  userId: string,
  status?: 'pending' | 'claimed' | 'expired'
): Promise<AffiliateReward[]> {
  try {
    let query = supabase
      .from('affiliate_rewards')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching affiliate rewards:', error);
    return [];
  }
}

/**
 * Claim an affiliate reward
 */
export async function claimAffiliateReward(rewardId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('affiliate_rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return false;
  }
}

/**
 * Get top affiliates (leaderboard)
 */
export async function getTopAffiliates(limit: number = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('affiliate_rewards')
      .select('user_id, reward_value')
      .eq('status', 'claimed');

    if (error) throw error;
    
    const grouped: { [key: string]: any } = {};
    (data || []).forEach((reward: any) => {
      if (!grouped[reward.user_id]) {
        grouped[reward.user_id] = {
          user_id: reward.user_id,
          referral_count: 0,
          total_rewards: 0,
        };
      }
      grouped[reward.user_id].referral_count += 1;
      grouped[reward.user_id].total_rewards += reward.reward_value || 0;
    });
    
    // Sort by total_rewards descending
    const result = Object.values(grouped).sort((a: any, b: any) => b.total_rewards - a.total_rewards);
    
    return result.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top affiliates:', error);
    return [];
  }
}
