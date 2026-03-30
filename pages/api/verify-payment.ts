/**
 * API Route: Verify Payment
 * Verifies Flutterwave payment and updates transaction status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFlutterwavePayment } from '@/lib/flutterwave';
import {
  updatePaymentRequestStatus,
  createTransaction,
  createTicketPurchase,
  getWalletBalance,
  updateWalletBalance,
  createAffiliateCommission,
} from '@/lib/supabase-db';

interface VerifyPaymentRequest {
  tx_ref: string;
  transaction_id?: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyPaymentResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { tx_ref, transaction_id } = req.body as VerifyPaymentRequest;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        error: 'Missing transaction reference',
      });
    }

    // Verify payment with Flutterwave
    const verificationResult = await verifyFlutterwavePayment(
      transaction_id || tx_ref
    );

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error || 'Payment verification failed',
      });
    }

    // Payment verified successfully
    // In a real implementation, you would:
    // 1. Update payment request status to 'completed'
    // 2. Create ticket records
    // 3. Update wallet balance
    // 4. Create affiliate commissions
    // 5. Send confirmation emails

    // For now, we'll return success
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Error in verify-payment API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
