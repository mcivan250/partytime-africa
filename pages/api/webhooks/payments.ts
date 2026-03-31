import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { handleStripeWebhook, handleFlutterwaveWebhook } from '@/lib/payment-gateway';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia' as any,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = req.query.provider as string;

  try {
    if (provider === 'stripe') {
      return handleStripeWebhookRequest(req, res);
    } else if (provider === 'flutterwave') {
      return handleFlutterwaveWebhookRequest(req, res);
    } else {
      return res.status(400).json({ error: 'Unknown payment provider' });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============ STRIPE WEBHOOK HANDLER ============

async function handleStripeWebhookRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  const result = handleStripeWebhook(event);

  if (!result.success) {
    return res.status(400).json({ error: 'Failed to process webhook' });
  }

  // Update transaction status based on event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const metadata = paymentIntent.metadata || {};

    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('transaction_id', paymentIntent.id);

    // Create tickets
    if (metadata.ticketTierId && metadata.eventId) {
      const ticketCount = metadata.quantity || 1;
      const ticketPromises = Array.from({ length: parseInt(ticketCount) }, (_, i) => {
        return supabase.from('tickets').insert({
          user_id: metadata.userId,
          event_id: metadata.eventId,
          ticket_tier_id: metadata.ticketTierId,
          transaction_id: paymentIntent.id,
          ticket_number: `TKT-${paymentIntent.id}-${i + 1}`,
          status: 'valid',
          qr_code: `QR_${paymentIntent.id}_${i + 1}`,
        });
      });

      await Promise.all(ticketPromises);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any;

    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('transaction_id', paymentIntent.id);
  }

  return res.status(200).json({ received: true });
}

// ============ FLUTTERWAVE WEBHOOK HANDLER ============

async function handleFlutterwaveWebhookRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const signature = req.headers['verif-hash'] as string;
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature' });
  }

  // Verify webhook signature
  if (signature !== webhookSecret) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const payload = req.body;

  // Handle the webhook
  const result = handleFlutterwaveWebhook(payload);

  if (!result.success) {
    return res.status(400).json({ error: 'Failed to process webhook' });
  }

  // Update transaction status
  if (payload.status === 'successful') {
    const transactionId = payload.id;
    const metadata = payload.meta || {};

    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('transaction_id', transactionId);

    // Create tickets
    if (metadata.ticketTierId && metadata.eventId) {
      const ticketCount = metadata.quantity || 1;
      const ticketPromises = Array.from({ length: parseInt(ticketCount) }, (_, i) => {
        return supabase.from('tickets').insert({
          user_id: metadata.userId,
          event_id: metadata.eventId,
          ticket_tier_id: metadata.ticketTierId,
          transaction_id: transactionId,
          ticket_number: `TKT-${transactionId}-${i + 1}`,
          status: 'valid',
          qr_code: `QR_${transactionId}_${i + 1}`,
        });
      });

      await Promise.all(ticketPromises);
    }
  } else {
    const transactionId = payload.id;

    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('transaction_id', transactionId);
  }

  return res.status(200).json({ received: true });
}
