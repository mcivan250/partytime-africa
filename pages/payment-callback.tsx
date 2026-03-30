'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Processing your payment...');
  const [transactionRef, setTransactionRef] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const txRef = searchParams.get('tx_ref');
        const transactionId = searchParams.get('transaction_id');

        if (!txRef) {
          setStatus('failed');
          setMessage('Invalid payment reference');
          return;
        }

        setTransactionRef(txRef);

        // Verify payment with backend
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref: txRef,
            transaction_id: transactionId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Payment successful! Your tickets have been added to your account.');
          
          // Redirect to wallet after 3 seconds
          setTimeout(() => {
            router.push('/wallet');
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
              {status === 'loading' && (
                <div className="animate-spin">
                  <div className="w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full" />
                </div>
              )}
              {status === 'success' && (
                <div className="text-2xl">✓</div>
              )}
              {status === 'failed' && (
                <div className="text-2xl">✕</div>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-yellow-500/20 rounded-xl p-6 mb-6">
          <p className="text-gray-300 text-center mb-4">{message}</p>
          
          {transactionRef && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-400 mb-1">Transaction Reference</p>
              <p className="text-sm font-mono text-yellow-400 break-all">{transactionRef}</p>
            </div>
          )}

          {status === 'loading' && (
            <p className="text-sm text-gray-400 text-center">
              Please wait while we verify your payment...
            </p>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-300 text-center">
                You will be redirected to your wallet in a moment.
              </p>
              <Link
                href="/wallet"
                className="block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg text-center transition"
              >
                Go to Wallet
              </Link>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-300 text-center">
                Please try again or contact support if the problem persists.
              </p>
              <Link
                href="/events"
                className="block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg text-center transition"
              >
                Back to Events
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Need help? <a href="mailto:support@partytime.africa" className="text-yellow-500 hover:text-yellow-400">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
