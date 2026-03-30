import { supabase } from './supabase';

export interface TicketPurchase {
  event_id: string;
  user_id: string;
  tier: 'early_bird' | 'regular' | 'vip';
  quantity: number;
  total_price: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'payment' | 'earning' | 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export const TICKET_PRICES = {
  early_bird: 75000,
  regular: 100000,
  vip: 250000,
};

export const purchaseTickets = async (
  userId: string,
  eventId: string,
  tier: 'early_bird' | 'regular' | 'vip',
  quantity: number
): Promise<{ success: boolean; message: string; transactionId?: string }> => {
  try {
    const totalPrice = TICKET_PRICES[tier] * quantity;

    // Create transaction record
    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      user_id: userId,
      type: 'payment',
      amount: -totalPrice,
      description: `Ticket Purchase: ${tier.replace('_', ' ')} x${quantity}`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    // In a real app, this would integrate with Flutterwave
    // For now, we'll simulate the purchase
    console.log('Processing ticket purchase:', {
      userId,
      eventId,
      tier,
      quantity,
      totalPrice,
    });

    // Update wallet balance (in a real app, this would be done via Supabase)
    // For demo, we'll just return success
    return {
      success: true,
      message: `Successfully purchased ${quantity} ${tier.replace('_', ' ')} ticket(s) for ${totalPrice.toLocaleString()} UGX`,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error('Error purchasing tickets:', error);
    return {
      success: false,
      message: 'Failed to purchase tickets. Please try again.',
    };
  }
};

export const recordAffiliateEarning = async (
  userId: string,
  eventId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      user_id: userId,
      type: 'earning',
      amount: amount,
      description: description,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    console.log('Recording affiliate earning:', transaction);

    return {
      success: true,
      message: `Earned ${amount.toLocaleString()} UGX from affiliate commission`,
    };
  } catch (error) {
    console.error('Error recording affiliate earning:', error);
    return {
      success: false,
      message: 'Failed to record earning. Please try again.',
    };
  }
};

export const getWalletBalance = async (userId: string): Promise<number> => {
  try {
    // In a real app, this would query the wallets table
    // For demo, return a fixed balance
    return 150000;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
};

export const getTransactionHistory = async (
  userId: string,
  limit: number = 10
): Promise<Transaction[]> => {
  try {
    // In a real app, this would query the transactions table
    // For demo, return demo transactions
    const demoTransactions: Transaction[] = [
      {
        id: 'txn_1',
        user_id: userId,
        type: 'earning',
        amount: 25000,
        description: 'Affiliate commission: Skyline Brunch',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        id: 'txn_2',
        user_id: userId,
        type: 'payment',
        amount: -50000,
        description: 'Ticket Purchase: Ankara After Dark',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'txn_3',
        user_id: userId,
        type: 'deposit',
        amount: 100000,
        description: 'Mobile Money Deposit',
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    return demoTransactions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};
