'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletUpdates } from '@/hooks/useWalletUpdates';

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, transactions, loading, error } = useWalletUpdates(user?.id || null);
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'affiliate'>('balance');

  const balance = wallet?.balance || 150000;

  // Calculate affiliate earnings
  const affiliateEarnings = transactions
    .filter((t) => t.type === 'earning' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate total spent
  const totalSpent = Math.abs(
    transactions
      .filter((t) => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-accent hover:text-yellow-300">
            Back to Dashboard
          </Link>
        </div>
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
            <p className="text-xl font-bold text-accent">{affiliateEarnings.toLocaleString()} UGX</p>
          </div>
          <div className="card p-4 bg-secondary border-border/50">
            <p className="text-text-dark text-xs uppercase mb-1">Total Spent</p>
            <p className="text-xl font-bold text-yellow-500">{totalSpent.toLocaleString()} UGX</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'balance'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-dark hover:text-text-light'
            }`}
          >
            Balance
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'transactions'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-dark hover:text-text-light'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'affiliate'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-dark hover:text-text-light'
            }`}
          >
            Affiliate
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <div className="card p-6 bg-secondary border-border/50">
              <h3 className="font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/events"
                  className="block w-full bg-accent hover:bg-yellow-600 text-primary font-bold py-3 rounded-lg text-center transition"
                >
                  Buy Tickets
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold px-2">Transaction History</h3>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="card p-8 bg-secondary border-border/30 text-center">
                  <p className="text-text-dark">No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="card p-4 bg-secondary border-border/30 flex items-center justify-between hover:border-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.type === 'earning' ? '💰' : tx.type === 'deposit' ? '📥' : tx.type === 'payment' ? '🎫' : '📤'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm md:text-base capitalize">{tx.type}</p>
                        <p className="text-text-dark text-xs">
                          {new Date(tx.created_at).toLocaleDateString()} • {tx.status}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-text-light'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'affiliate' && (
          <div className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
