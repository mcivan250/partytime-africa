import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { initiatePayment, verifyPayment } from '@/lib/payment-gateway';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      action,
      amount,
      currency,
      email,
      eventId,
      ticketTierId,
      quantity,
      provider,
      transactionId,
      customerName,
      phoneNumber,
    } = req.body;

    // Verify user authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Handle payment initiation
    if (action === 'initiate') {
      const paymentResponse = await initiatePayment({
        amount,
        currency,
        description: `Event ticket purchase - ${eventId}`,
        email,
        provider,
        metadata: {
          userId: user.id,
          eventId,
          ticketTierId,
          quantity,
          customerName,
          phoneNumber,
        },
      });

      if (!paymentResponse.success) {
        return res.status(400).json({
          success: false,
          message: paymentResponse.message,
        });
      }

      // Store pending transaction in database
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          event_id: eventId,
          ticket_tier_id: ticketTierId,
          quantity,
          amount,
          currency,
          provider,
          transaction_id: paymentResponse.transactionId,
          status: 'pending',
          metadata: {
            customerName,
            phoneNumber,
          },
        });

      if (insertError) {
        console.error('Error storing transaction:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to store transaction',
        });
      }

      return res.status(200).json({
        success: true,
        transactionId: paymentResponse.transactionId,
        redirectUrl: paymentResponse.redirectUrl,
        message: 'Payment initiated successfully',
      });
    }

    // Handle payment verification
    if (action === 'verify') {
      if (!transactionId || !provider) {
        return res.status(400).json({
          error: 'Transaction ID and provider are required',
        });
      }

      const verificationResponse = await verifyPayment(transactionId, provider);

      if (!verificationResponse.success) {
        // Update transaction status to failed
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('transaction_id', transactionId);

        return res.status(400).json({
          success: false,
          message: verificationResponse.message,
        });
      }

      // Get transaction details
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (txError || !transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
      }

      // Update transaction status to completed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // Create ticket records for the user
      const ticketPromises = Array.from({ length: transaction.quantity }, (_, i) => {
        return supabase.from('tickets').insert({
          user_id: user.id,
          event_id: transaction.event_id,
          ticket_tier_id: transaction.ticket_tier_id,
          transaction_id: transactionId,
          ticket_number: `TKT-${Date.now()}-${i + 1}`,
          status: 'valid',
          qr_code: generateQRCode(transactionId, i + 1),
        });
      });

      await Promise.all(ticketPromises);

      // Send confirmation email
      try {
        await sendPaymentConfirmationEmail(
          email,
          transaction,
          verificationResponse.transactionId
        );
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified and tickets issued',
        transactionId: verificationResponse.transactionId,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Helper function to generate QR code
function generateQRCode(transactionId: string, ticketNumber: number): string {
  // This would integrate with a QR code generation library
  // For now, return a placeholder
  return `QR_${transactionId}_${ticketNumber}`;
}

// Helper function to send confirmation email
async function sendPaymentConfirmationEmail(
  email: string,
  transaction: any,
  transactionId: string
): Promise<void> {
  // This would integrate with your email service (SendGrid, Mailgun, etc.)
  // For now, just log it
  console.log(`Sending confirmation email to ${email} for transaction ${transactionId}`);

  // TODO: Implement actual email sending
  // const emailService = new EmailService();
  // await emailService.sendPaymentConfirmation({
  //   to: email,
  //   transactionId,
  //   amount: transaction.amount,
  //   currency: transaction.currency,
  //   ticketCount: transaction.quantity,
  // });
}
