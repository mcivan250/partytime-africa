'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wallet, Transaction, formatCurrency } from '@/lib/payment-types';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'mtn' | 'airtel' | 'mpesa'>('mtn');

  useEffect(() => {
    loadWallet();
    loadTransactions();
  }, []);

  const loadWallet = async () => {
    // For demo: create dummy wallet
    setWallet({
      id: '1',
      user_id: '1',
      balance_cents: 5000, // $50
      currency: 'USD',
      is_locked: false,
      verification_tier: 2,
      daily_limit_cents: 50000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setLoading(false);
  };

  const loadTransactions = async () => {
    // Demo transactions
    setTransactions([
      {
        id: '1',
        wallet_id: '1',
        type: 'deposit',
        amount_cents: 5000,
        currency: 'USD',
        status: 'completed',
        description: 'MTN Mobile Money deposit',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    ]);
  };

  const handleTopUp = () => {
    alert(`Top up ${formatCurrency(parseFloat(topUpAmount) * 100)} via ${selectedProvider.toUpperCase()}`);
    setShowTopUp(false);
  };

  const handleWithdraw = () => {
    alert('Withdraw functionality coming soon!');
    setShowWithdraw(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-gray-600 mt-1">Manage your Party Time balance</p>
          </div>
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-purple-100 text-sm mb-2">Available Balance</p>
                  <h2 className="text-5xl font-bold">
                    {wallet ? formatCurrency(wallet.balance_cents) : '$0.00'}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                    Tier {wallet?.verification_tier}
                  </div>
                  <p className="text-xs text-purple-100 mt-2">
                    Daily limit: {wallet ? formatCurrency(wallet.daily_limit_cents) : '$0'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => setShowTopUp(true)}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                >
                  <span>💳</span>
                  <span>Top Up</span>
                </button>
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                >
                  <span>🏦</span>
                  <span>Withdraw</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-gray-600 text-sm mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">$120</p>
                <p className="text-green-600 text-xs mt-1">↑ Spent</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-gray-600 text-sm mb-1">Tickets</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-purple-600 text-xs mt-1">Active</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-gray-600 text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">$45</p>
                <p className="text-orange-600 text-xs mt-1">Installments</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/wallet/transactions"
                  className="block w-full bg-gray-100 hover:bg-gray-200 transition py-3 px-4 rounded-lg text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">View All Transactions</span>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
                <Link
                  href="/wallet/installments"
                  className="block w-full bg-gray-100 hover:bg-gray-200 transition py-3 px-4 rounded-lg text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Payment Plans</span>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
                <Link
                  href="/wallet/settings"
                  className="block w-full bg-gray-100 hover:bg-gray-200 transition py-3 px-4 rounded-lg text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Security Settings</span>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mt-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✓</div>
                <div>
                  <h4 className="font-bold text-green-900 mb-1">Tier 2 Verified</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Email and phone verified. Upgrade to Tier 3 for higher limits.
                  </p>
                  <button className="text-green-900 font-semibold text-sm hover:underline">
                    Upgrade Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-gray-900 mb-6">Recent Transactions</h3>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Top up your wallet to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        {tx.type === 'deposit' && '💳'}
                        {tx.type === 'withdrawal' && '🏦'}
                        {tx.type === 'payment' && '🎟️'}
                        {tx.type === 'refund' && '↩️'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tx.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tx.type === 'deposit' || tx.type === 'refund'
                            ? 'text-green-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                        {formatCurrency(tx.amount_cents)}
                      </p>
                      <p
                        className={`text-xs ${
                          tx.status === 'completed'
                            ? 'text-green-600'
                            : tx.status === 'pending'
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Up Modal */}
        {showTopUp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Top Up Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedProvider('mtn')}
                      className={`py-3 rounded-lg font-semibold ${
                        selectedProvider === 'mtn'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      MTN
                    </button>
                    <button
                      onClick={() => setSelectedProvider('airtel')}
                      className={`py-3 rounded-lg font-semibold ${
                        selectedProvider === 'airtel'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Airtel
                    </button>
                    <button
                      onClick={() => setSelectedProvider('mpesa')}
                      className={`py-3 rounded-lg font-semibold ${
                        selectedProvider === 'mpesa'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      M-Pesa
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowTopUp(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTopUp}
                    disabled={!topUpAmount}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
