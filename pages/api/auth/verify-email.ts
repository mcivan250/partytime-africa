import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    return handleSendVerification(req, res);
  } else if (req.method === 'GET') {
    return handleVerifyToken(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleSendVerification(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      return res.status(500).json({ error: 'Failed to find user' });
    }

    const user = users?.find((u) => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        user_id: user.id,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error storing verification token:', insertError);
      return res.status(500).json({ error: 'Failed to generate verification token' });
    }

    // Generate verification link
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    // Send verification email
    try {
      const { sendVerificationEmail } = await import('@/lib/email-service');
      const emailSent = await sendVerificationEmail(
        email,
        verificationLink,
        user.user_metadata?.name || 'User'
      );

      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send verification email' });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleVerifyToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find verification record
    const { data: verification, error: findError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !verification) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    // Check if already verified
    if (verification.verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Mark email as verified in Supabase Auth
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    );

    if (updateAuthError) {
      console.error('Error confirming email:', updateAuthError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Mark verification as completed
    const { error: updateVerificationError } = await supabase
      .from('email_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', verification.id);

    if (updateVerificationError) {
      console.error('Error updating verification:', updateVerificationError);
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      userId: verification.user_id,
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
