/**
 * API Route: Purchase Ticket
 * Handles ticket purchase requests and initiates Flutterwave payment
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  initializeFlutterwavePayment,
  generateTransactionRef,
  formatAmountForFlutterwave,
} from '@/lib/flutterwave';
import {
  getOrCreateWallet,
  createPaymentRequest,
  createTransaction,
} from '@/lib/supabase-db';

interface PurchaseTicketRequest {
  eventId: string;
  userId: string;
  tier: 'early_bird' | 'regular' | 'vip';
  quantity: number;
  pricePerTicket: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

interface PurchaseTicketResponse {
  success: boolean;
  paymentLink?: string;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PurchaseTicketResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      eventId,
      userId,
      tier,
      quantity,
      pricePerTicket,
      customerEmail,
      customerName,
      customerPhone,
    } = req.body as PurchaseTicketRequest;

    // Validate required fields
    if (
      !eventId ||
      !userId ||
      !tier ||
      !quantity ||
      !pricePerTicket ||
      !customerEmail ||
      !customerName ||
      !customerPhone
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Calculate total amount
    const totalAmount = pricePerTicket * quantity;

    // Ensure wallet exists
    await getOrCreateWallet(userId);

    // Generate unique transaction reference
    const txRef = generateTransactionRef(userId, eventId);

    // Format amount for Flutterwave
    const formattedAmount = formatAmountForFlutterwave(totalAmount);

    // Initialize Flutterwave payment
    const flutterwaveResult = await initializeFlutterwavePayment({
      amount: formattedAmount,
      currency: 'UGX',
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      tx_ref: txRef,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-callback?tx_ref=${txRef}`,
      meta: {
        event_id: eventId,
        user_id: userId,
        ticket_tier: tier,
        quantity,
      },
    });

    if (!flutterwaveResult.success) {
      return res.status(400).json({
        success: false,
        error: flutterwaveResult.error || 'Failed to initialize payment',
      });
    }

    // Create payment request record
    const paymentRequestResult = await createPaymentRequest(
      userId,
      eventId,
      totalAmount,
      flutterwaveResult.paymentLink || '',
      txRef
    );

    if (!paymentRequestResult.success) {
      console.error('Failed to create payment request:', paymentRequestResult.error);
      // Continue anyway - payment link is still valid
    }

    // Create pending transaction record
    const transactionResult = await createTransaction(
      userId,
      'payment',
      totalAmount,
      `Ticket purchase for event ${eventId}`,
      txRef,
      {
        event_id: eventId,
        ticket_tier: tier,
        quantity,
        status: 'pending',
      }
    );

    if (!transactionResult.success) {
      console.error('Failed to create transaction:', transactionResult.error);
    }

    return res.status(200).json({
      success: true,
      paymentLink: flutterwaveResult.paymentLink,
      message: 'Payment initialized successfully',
    });
  } catch (error) {
    console.error('Error in purchase-ticket API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
