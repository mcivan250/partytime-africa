/**
 * Supabase Database Integration
 * Handles wallet, transaction, and ticket management
 */

import { createClient } from '@supabase/supabase-js';




const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";


const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";



export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get or create user wallet
 */
export async function getOrCreateWallet(userId: string) {
  try {
    // Try to get existing wallet
    const { data: wallet, error: getError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (wallet) {
      return { success: true, wallet };
    }

    // Create new wallet if doesn't exist
    if (getError?.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert([
          {
            user_id: userId,
            balance: 0,
            currency: 'UGX',
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating wallet:', createError);
        return { success: false, error: createError.message };
      }

      return { success: true, wallet: newWallet };
    }

    return { success: false, error: getError?.message };
  } catch (error) {
    console.error('Error in getOrCreateWallet:', error);
    return { success: false, error: 'Failed to get or create wallet' };
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string) {
  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting wallet balance:', error);
      return { success: false, error: error.message };
    }

    return { success: true, balance: wallet?.balance || 0 };
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    return { success: false, error: 'Failed to get wallet balance' };
  }
}

/**
 * Create transaction record
 */
export async function createTransaction(
  userId: string,
  type: 'payment' | 'earning' | 'deposit' | 'withdrawal',
  amount: number,
  description: string,
  referenceId?: string,
  metadata?: any
) {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type,
          amount,
          description,
          reference_id: referenceId,
          metadata,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, transaction };
  } catch (error) {
    console.error('Error in createTransaction:', error);
    return { success: false, error: 'Failed to create transaction' };
  }
}

/**
 * Get user transactions
 */
export async function getUserTransactions(userId: string, limit = 20) {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting transactions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, transactions };
  } catch (error) {
    console.error('Error in getUserTransactions:', error);
    return { success: false, error: 'Failed to get transactions' };
  }
}

/**
 * Create ticket purchase
 */
export async function createTicketPurchase(
  eventId: string,
  userId: string,
  tier: 'early_bird' | 'regular' | 'vip',
  quantity: number,
  pricePerTicket: number,
  transactionId: string
) {
  try {
    const totalPrice = pricePerTicket * quantity;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          tier,
          quantity,
          price_per_ticket: pricePerTicket,
          total_price: totalPrice,
          transaction_id: transactionId,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ticket };
  } catch (error) {
    console.error('Error in createTicketPurchase:', error);
    return { success: false, error: 'Failed to create ticket purchase' };
  }
}

/**
 * Get user tickets
 */
export async function getUserTickets(userId: string) {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events:event_id (
          title,
          date_time,
          location_address
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting tickets:', error);
      return { success: false, error: error.message };
    }

    return { success: true, tickets };
  } catch (error) {
    console.error('Error in getUserTickets:', error);
    return { success: false, error: 'Failed to get tickets' };
  }
}

/**
 * Create payment request
 */
export async function createPaymentRequest(
  userId: string,
  eventId: string,
  amount: number,
  flutterwaveLink: string,
  flutterwaveTxRef: string
) {
  try {
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          amount,
          currency: 'UGX',
          status: 'pending',
          flutterwave_link: flutterwaveLink,
          flutterwave_tx_ref: flutterwaveTxRef,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, paymentRequest };
  } catch (error) {
    console.error('Error in createPaymentRequest:', error);
    return { success: false, error: 'Failed to create payment request' };
  }
}

/**
 * Update payment request status
 */
export async function updatePaymentRequestStatus(
  paymentRequestId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed'
) {
  try {
    const { data: updated, error } = await supabase
      .from('payment_requests')
      .update({ status })
      .eq('id', paymentRequestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, paymentRequest: updated };
  } catch (error) {
    console.error('Error in updatePaymentRequestStatus:', error);
    return { success: false, error: 'Failed to update payment request' };
  }
}

/**
 * Create affiliate commission
 */
export async function createAffiliateCommission(
  referrerId: string,
  ticketId: string,
  commissionAmount: number,
  commissionRate = 10
) {
  try {
    const { data: commission, error } = await supabase
      .from('affiliate_commissions')
      .insert([
        {
          referrer_id: referrerId,
          ticket_id: ticketId,
          commission_amount: commissionAmount,
          commission_rate: commissionRate,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating affiliate commission:', error);
      return { success: false, error: error.message };
    }

    return { success: true, commission };
  } catch (error) {
    console.error('Error in createAffiliateCommission:', error);
    return { success: false, error: 'Failed to create affiliate commission' };
  }
}

/**
 * Get user affiliate earnings
 */
export async function getUserAffiliateEarnings(userId: string) {
  try {
    const { data: commissions, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('referrer_id', userId);

    if (error) {
      console.error('Error getting affiliate earnings:', error);
      return { success: false, error: error.message };
    }

    const totalEarnings = commissions?.reduce(
      (sum, commission) => sum + (commission.commission_amount || 0),
      0
    ) || 0;

    return { success: true, commissions, totalEarnings };
  } catch (error) {
    console.error('Error in getUserAffiliateEarnings:', error);
    return { success: false, error: 'Failed to get affiliate earnings' };
  }
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(userId: string, newBalance: number) {
  try {
    const { data: updated, error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating wallet balance:', error);
      return { success: false, error: error.message };
    }

    return { success: true, wallet: updated };
  } catch (error) {
    console.error('Error in updateWalletBalance:', error);
    return { success: false, error: 'Failed to update wallet balance' };
  }
}

/**
 * Get all events
 */
export async function getEvents() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date_time', { ascending: true });

      if (error) {
        
        return { success: false, error: error.message };
      }

    return { success: true, events };
  } catch (error) {
    console.error('Error in getEvents:', error);
    return { success: false, error: 'Failed to get events' };
  }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

      if (error) {
        
        return { success: false, error: error.message };
      }

    return { success: true, event };
  } catch (error) {
    console.error('Error in getEventById:', error);
    return { success: false, error: 'Failed to get event by ID' };
  }
}
