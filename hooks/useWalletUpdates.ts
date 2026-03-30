/**
 * Hook: useWalletUpdates
 * Real-time wallet and transaction updates using Supabase subscriptions
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-db';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionData {
  id: string;
  user_id: string;
  type: 'payment' | 'earning' | 'deposit' | 'withdrawal';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
}

interface UseWalletUpdatesReturn {
  wallet: WalletData | null;
  transactions: TransactionData[];
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

export function useWalletUpdates(userId: string | null): UseWalletUpdatesReturn {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet data
  const refreshWallet = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setWallet(data || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError('Failed to load wallet');
    }
  }, [userId]);

  // Fetch transactions data
  const refreshTransactions = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setTransactions(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([refreshWallet(), refreshTransactions()]);
      setLoading(false);
    };

    if (userId) {
      loadData();
    }
  }, [userId, refreshWallet, refreshTransactions]);

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!userId) return;

    let walletChannel: RealtimeChannel | null = null;

    try {
      walletChannel = supabase
        .channel(`wallet:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new) {
              setWallet(payload.new as WalletData);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Error subscribing to wallet updates:', err);
    }

    return () => {
      if (walletChannel) {
        supabase.removeChannel(walletChannel);
      }
    };
  }, [userId]);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    if (!userId) return;

    let transactionChannel: RealtimeChannel | null = null;

    try {
      transactionChannel = supabase
        .channel(`transactions:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new) {
              setTransactions((prev) => [
                payload.new as TransactionData,
                ...prev,
              ]);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Error subscribing to transaction updates:', err);
    }

    return () => {
      if (transactionChannel) {
        supabase.removeChannel(transactionChannel);
      }
    };
  }, [userId]);

  return {
    wallet,
    transactions,
    loading,
    error,
    refreshWallet,
    refreshTransactions,
  };
}
