/**
 * Flutterwave Payment Integration
 * Handles UGX payments for ticket purchases via Mobile Money and Card
 */

const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface FlutterwavePaymentRequest {
  amount: number; // Amount in UGX
  currency: string; // 'UGX'
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  tx_ref: string; // Unique transaction reference
  redirect_url: string;
  meta: {
    event_id: string;
    user_id: string;
    ticket_tier: string;
    quantity: number;
  };
}

export interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data?: {
    link: string;
    access_code: string;
  };
}

export interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      id: number;
      email: string;
      name: string;
      phone_number: string;
    };
    meta: {
      event_id: string;
      user_id: string;
      ticket_tier: string;
      quantity: number;
    };
  };
}

/**
 * Initialize Flutterwave payment
 * Returns a payment link for the user to complete payment
 */
export async function initializeFlutterwavePayment(
  paymentRequest: FlutterwavePaymentRequest
): Promise<{ success: boolean; paymentLink?: string; error?: string }> {
  try {
    if (!FLUTTERWAVE_SECRET_KEY) {
      console.error('Flutterwave secret key not configured');
      return {
        success: false,
        error: 'Payment service not configured',
      };
    }

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: paymentRequest.tx_ref,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        redirect_url: paymentRequest.redirect_url,
        customer: {
          email: paymentRequest.customer_email,
          name: paymentRequest.customer_name,
          phonenumber: paymentRequest.customer_phone,
        },
        customizations: {
          title: 'PartyTime Africa - Ticket Purchase',
          description: `Purchase tickets for event`,
          logo: 'https://partytime.africa/logo.png',
        },
        meta: paymentRequest.meta,
      }),
    });

    const data: FlutterwavePaymentResponse = await response.json();

    if (data.status === 'success' && data.data?.link) {
      return {
        success: true,
        paymentLink: data.data.link,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to initialize payment',
      };
    }
  } catch (error) {
    console.error('Flutterwave payment initialization error:', error);
    return {
      success: false,
      error: 'Payment initialization failed',
    };
  }
}

/**
 * Verify Flutterwave payment
 * Called after user completes payment to verify transaction
 */
export async function verifyFlutterwavePayment(
  transactionId: string
): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  error?: string;
}> {
  try {
    if (!FLUTTERWAVE_SECRET_KEY) {
      return {
        success: false,
        error: 'Payment service not configured',
      };
    }

    const response = await fetch(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.status === 'success' && data.data?.status === 'successful') {
      return {
        success: true,
        status: data.data.status,
        amount: data.data.amount,
      };
    } else {
      return {
        success: false,
        error: 'Payment verification failed',
      };
    }
  } catch (error) {
    console.error('Flutterwave payment verification error:', error);
    return {
      success: false,
      error: 'Payment verification failed',
    };
  }
}

/**
 * Generate unique transaction reference
 */
export function generateTransactionRef(userId: string, eventId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `PT_${userId.substring(0, 8)}_${eventId.substring(0, 8)}_${timestamp}_${random}`;
}

/**
 * Format amount for Flutterwave (convert to smallest unit if needed)
 */
export function formatAmountForFlutterwave(amountInUGX: number): number {
  // Flutterwave expects amount in the currency's smallest unit
  // For UGX, the smallest unit is 1 UGX, so no conversion needed
  return amountInUGX;
}

/**
 * Verify Flutterwave webhook signature
 */
export function verifyFlutterwaveWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!FLUTTERWAVE_SECRET_KEY) {
    return false;
  }

  // Flutterwave uses SHA256 HMAC for webhook verification
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', FLUTTERWAVE_SECRET_KEY)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

/**
 * Handle Flutterwave webhook
 */
export async function handleFlutterwaveWebhook(
  payload: FlutterwaveWebhookPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const { event, data } = payload;

    if (event === 'charge.completed' && data.status === 'successful') {
      // Payment successful - update transaction and wallet
      return {
        success: true,
        message: 'Payment processed successfully',
      };
    } else if (event === 'charge.failed' || data.status === 'failed') {
      // Payment failed - update transaction status
      return {
        success: false,
        message: 'Payment failed',
      };
    }

    return {
      success: true,
      message: 'Webhook processed',
    };
  } catch (error) {
    console.error('Flutterwave webhook handling error:', error);
    return {
      success: false,
      message: 'Webhook processing failed',
    };
  }
}
