import Stripe from 'stripe';
import axios from 'axios';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia' as any,
});

// Flutterwave configuration
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';

// Payment provider types
export type PaymentProvider = 'stripe' | 'flutterwave';

export interface PaymentRequest {
  amount: number; // Amount in cents (Stripe) or base currency (Flutterwave)
  currency: string;
  description: string;
  email: string;
  metadata?: Record<string, any>;
  provider: PaymentProvider;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  provider: PaymentProvider;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  redirectUrl?: string;
}

// ============ STRIPE INTEGRATION ============

export const createStripePaymentIntent = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: request.amount,
      currency: request.currency.toLowerCase(),
      description: request.description,
      receipt_email: request.email,
      metadata: {
        ...request.metadata,
        provider: 'stripe',
      },
    });

    return {
      success: true,
      transactionId: paymentIntent.id,
      provider: 'stripe',
      status: 'pending',
      message: 'Payment intent created successfully',
    };
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      transactionId: '',
      provider: 'stripe',
      status: 'failed',
      message: error.message || 'Failed to create payment intent',
    };
  }
};

export const confirmStripePayment = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentResponse> => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return {
      success: paymentIntent.status === 'succeeded',
      transactionId: paymentIntent.id,
      provider: 'stripe',
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
      message: `Payment ${paymentIntent.status}`,
    };
  } catch (error: any) {
    console.error('Stripe confirmation error:', error);
    return {
      success: false,
      transactionId: '',
      provider: 'stripe',
      status: 'failed',
      message: error.message || 'Failed to confirm payment',
    };
  }
};

export const retrieveStripePaymentIntent = async (
  paymentIntentId: string
): Promise<any> => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error: any) {
    console.error('Stripe retrieval error:', error);
    throw error;
  }
};

// ============ FLUTTERWAVE INTEGRATION ============

export const createFlutterwavePayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  try {
    const payload = {
      tx_ref: `partytime_${Date.now()}`,
      amount: request.amount,
      currency: request.currency.toUpperCase(),
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: request.email,
        name: request.metadata?.customerName || 'Customer',
        phonenumber: request.metadata?.phoneNumber || '',
      },
      customizations: {
        title: 'PartyTime Africa',
        description: request.description,
        logo: 'https://www.partytime.africa/logo.png',
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-callback?provider=flutterwave`,
      meta: {
        ...request.metadata,
        provider: 'flutterwave',
      },
    };

    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'success') {
      return {
        success: true,
        transactionId: response.data.data.id,
        provider: 'flutterwave',
        status: 'pending',
        redirectUrl: response.data.data.link,
        message: 'Payment link created successfully',
      };
    } else {
      return {
        success: false,
        transactionId: '',
        provider: 'flutterwave',
        status: 'failed',
        message: response.data.message || 'Failed to create payment',
      };
    }
  } catch (error: any) {
    console.error('Flutterwave payment error:', error);
    return {
      success: false,
      transactionId: '',
      provider: 'flutterwave',
      status: 'failed',
      message: error.message || 'Failed to create payment',
    };
  }
};

export const verifyFlutterwavePayment = async (
  transactionId: string
): Promise<PaymentResponse> => {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === 'success') {
      const transaction = response.data.data;
      return {
        success: transaction.status === 'successful',
        transactionId: transaction.id,
        provider: 'flutterwave',
        status: transaction.status === 'successful' ? 'completed' : 'failed',
        message: `Payment ${transaction.status}`,
      };
    } else {
      return {
        success: false,
        transactionId: '',
        provider: 'flutterwave',
        status: 'failed',
        message: response.data.message || 'Failed to verify payment',
      };
    }
  } catch (error: any) {
    console.error('Flutterwave verification error:', error);
    return {
      success: false,
      transactionId: '',
      provider: 'flutterwave',
      status: 'failed',
      message: error.message || 'Failed to verify payment',
    };
  }
};

// ============ UNIFIED PAYMENT INTERFACE ============

export const initiatePayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  if (request.provider === 'stripe') {
    return createStripePaymentIntent(request);
  } else if (request.provider === 'flutterwave') {
    return createFlutterwavePayment(request);
  } else {
    return {
      success: false,
      transactionId: '',
      provider: request.provider,
      status: 'failed',
      message: 'Unknown payment provider',
    };
  }
};

export const verifyPayment = async (
  transactionId: string,
  provider: PaymentProvider
): Promise<PaymentResponse> => {
  if (provider === 'stripe') {
    const paymentIntent = await retrieveStripePaymentIntent(transactionId);
    return {
      success: paymentIntent.status === 'succeeded',
      transactionId: paymentIntent.id,
      provider: 'stripe',
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
      message: `Payment ${paymentIntent.status}`,
    };
  } else if (provider === 'flutterwave') {
    return verifyFlutterwavePayment(transactionId);
  } else {
    return {
      success: false,
      transactionId: '',
      provider,
      status: 'failed',
      message: 'Unknown payment provider',
    };
  }
};

// ============ REFUND HANDLING ============

export const refundStripePayment = async (
  paymentIntentId: string,
  amount?: number
): Promise<any> => {
  try {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
    });
  } catch (error: any) {
    console.error('Stripe refund error:', error);
    throw error;
  }
};

export const refundFlutterwavePayment = async (
  transactionId: string
): Promise<any> => {
  try {
    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/refund`,
      {},
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Flutterwave refund error:', error);
    throw error;
  }
};

// ============ WEBHOOK HANDLERS ============

export const handleStripeWebhook = (event: any) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Stripe: Payment succeeded', event.data.object);
      return { success: true, status: 'completed' };

    case 'payment_intent.payment_failed':
      console.log('Stripe: Payment failed', event.data.object);
      return { success: false, status: 'failed' };

    case 'charge.refunded':
      console.log('Stripe: Charge refunded', event.data.object);
      return { success: true, status: 'refunded' };

    default:
      console.log('Stripe: Unhandled event type', event.type);
      return { success: false };
  }
};

export const handleFlutterwaveWebhook = (payload: any) => {
  if (payload.status === 'successful') {
    console.log('Flutterwave: Payment successful', payload);
    return { success: true, status: 'completed' };
  } else {
    console.log('Flutterwave: Payment failed', payload);
    return { success: false, status: 'failed' };
  }
};
