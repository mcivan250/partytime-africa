'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'earning' | 'payment';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // In a real app, we would fetch from a 'wallets' and 'transactions' table
      // For MVP/Demo, we'll simulate some data if the tables don't exist yet
      setBalance(150000); // 150,000 UGX
      
      const demoTransactions: Transaction[] = [
        {
          id: '1',
          type: 'earning',
          amount: 25000,
          status: 'completed',
          description: 'Affiliate commission: Skyline Brunch',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'payment',
          amount: -50000,
          status: 'completed',
          description: 'Ticket Purchase: Ankara After Dark',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          type: 'deposit',
          amount: 100000,
          status: 'completed',
          description: 'Mobile Money Deposit',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setTransactions(demoTransactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-light pb-20">
      {/* Header */}
      <div className="bg-secondary border-b border-border p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-accent hover:text-yellow-300">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-display font-bold">My Wallet</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-accent to-yellow-600 rounded-2xl p-8 shadow-xl text-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <span className="text-6xl">💎</span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">Available Balance</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            {balance.toLocaleString()} <span className="text-2xl">UGX</span>
          </h2>
          <div className="flex gap-4">
            <button className="flex-1 bg-primary text-text-light py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all">
              Add Funds
            </button>
            <button className="flex-1 bg-white bg-opacity-20 text-primary py-3 rounded-xl font-bold hover:bg-opacity-30 transition-all border border-primary border-opacity-10">
              Withdraw
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 bg-secondary border-border/50">
            <p className="text-text-dark text-xs uppercase mb-1">Total Earned</p>
            <p className="text-xl font-bold text-accent">45,000 UGX</p>
          </div>
          <div className="card p-4 bg-secondary border-border/50">
            <p className="text-text-dark text-xs uppercase mb-1">Pending</p>
            <p className="text-xl font-bold text-yellow-500">12,500 UGX</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold px-2">Transaction History</h3>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="card p-4 bg-secondary border-border/30 flex items-center justify-between hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.type === 'earning' ? '💰' : tx.type === 'deposit' ? '📥' : tx.type === 'payment' ? '🎫' : '📤'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">{tx.description}</p>
                    <p className="text-text-dark text-xs">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.status}
                    </p>
                  </div>
                </div>
                <div className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-text-light'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate Section Link */}
        <Link href="/dashboard/affiliate-gold" className="block">
          <div className="card p-6 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-accent/20 flex items-center justify-between group">
            <div>
              <h4 className="text-lg font-bold text-accent mb-1">Affiliate Gold Program</h4>
              <p className="text-text-dark text-sm">Earn commissions by sharing events you love.</p>
            </div>
            <div className="text-2xl group-hover:translate-x-2 transition-transform">✨</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
