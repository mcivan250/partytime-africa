import { supabase } from './supabase';
import * as bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  profile_photo_url?: string;
  email_verified: boolean;
  phone_verified: boolean;
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// PIN validation
export function validatePIN(pin: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (pin.length !== 6) {
    errors.push('PIN must be exactly 6 digits');
  }
  if (!/^\d+$/.test(pin)) {
    errors.push('PIN must contain only numbers');
  }
  // Check for sequential numbers
  if (/012345|123456|234567|345678|456789|567890/.test(pin)) {
    errors.push('PIN cannot be sequential');
  }
  // Check for repeating numbers
  if (/^(\d)\1{5}$/.test(pin)) {
    errors.push('PIN cannot be all the same digit');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Enhanced signup with email verification
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  metadata?: { ip_address?: string; user_agent?: string }
) {
  // Validate password strength
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.errors.join(', '));
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email,
        name,
        email_verified: false, // Require verification
      },
    ]);

  if (profileError) throw profileError;

  // Create wallet with Tier 1 limits (basic)
  await createWallet(authData.user.id, 1);

  // Log signup event
  await logAuditEvent({
    user_id: authData.user.id,
    action: 'signup',
    entity_type: 'user',
    entity_id: authData.user.id,
    ip_address: metadata?.ip_address,
    user_agent: metadata?.user_agent,
    success: true,
  });

  return authData.user;
}

// Enhanced sign in with rate limiting
export async function signInWithEmail(
  email: string,
  password: string,
  metadata?: { ip_address?: string; user_agent?: string }
) {
  // Check rate limiting (track failed attempts)
  const recentAttempts = await getRecentFailedAttempts(email);
  
  if (recentAttempts >= 5) {
    const lockoutTime = await getLockoutTime(email);
    if (lockoutTime && new Date() < lockoutTime) {
      throw new Error(`Account locked. Try again after ${lockoutTime.toLocaleTimeString()}`);
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Log failed attempt
    await logFailedAttempt(email, metadata?.ip_address);
    await logAuditEvent({
      action: 'login_failed',
      entity_type: 'user',
      ip_address: metadata?.ip_address,
      user_agent: metadata?.user_agent,
      success: false,
      error_message: error.message,
    });
    throw error;
  }

  // Clear failed attempts on success
  await clearFailedAttempts(email);

  // Log successful login
  await logAuditEvent({
    user_id: data.user?.id,
    action: 'login',
    entity_type: 'user',
    entity_id: data.user?.id,
    ip_address: metadata?.ip_address,
    user_agent: metadata?.user_agent,
    success: true,
  });

  return data.user;
}

// Phone authentication with SMS OTP
export async function signInWithPhone(phone: string) {
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone);

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) throw error;
  return data;
}

export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizePhoneNumber(phone),
    token,
    type: 'sms',
  });

  if (error) throw error;

  // Update phone verification status
  if (data.user) {
    await supabase
      .from('users')
      .update({ phone_verified: true })
      .eq('id', data.user.id);
  }

  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    phone: profile.phone_number,
    name: profile.name,
    profile_photo_url: profile.profile_photo_url,
    email_verified: profile.email_verified || false,
    phone_verified: profile.phone_verified || false,
  };
}

// Wallet creation with tier-based limits
export async function createWallet(userId: string, tier: number = 1) {
  const limits = {
    1: { daily: 200000, single: 50000 },    // UGX 200K/day, 50K per transaction
    2: { daily: 2000000, single: 500000 },  // UGX 2M/day, 500K per transaction
    3: { daily: 20000000, single: 5000000 }, // UGX 20M/day, 5M per transaction
  };

  const limit = limits[tier as keyof typeof limits] || limits[1];

  const { error } = await supabase
    .from('wallets')
    .insert([
      {
        user_id: userId,
        balance_cents: 0,
        currency: 'UGX',
        verification_tier: tier,
        daily_limit_cents: limit.daily,
        single_transaction_limit_cents: limit.single,
      },
    ]);

  if (error && error.code !== '23505') {
    throw error;
  }
}

// Wallet PIN management
export async function setWalletPIN(userId: string, pin: string) {
  // Validate PIN
  const pinCheck = validatePIN(pin);
  if (!pinCheck.valid) {
    throw new Error(pinCheck.errors.join(', '));
  }

  // Hash PIN with bcrypt
  const salt = await bcrypt.genSalt(10);
  const pinHash = await bcrypt.hash(pin, salt);

  const { error } = await supabase
    .from('wallets')
    .update({
      pin_hash: pinHash,
      pin_set_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;

  await logAuditEvent({
    user_id: userId,
    action: 'pin_set',
    entity_type: 'wallet',
    success: true,
  });
}

export async function verifyWalletPIN(userId: string, pin: string): Promise<boolean> {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('pin_hash, is_locked, failed_pin_attempts, locked_until')
    .eq('user_id', userId)
    .single();

  if (!wallet) throw new Error('Wallet not found');

  // Check if wallet is locked
  if (wallet.is_locked) {
    if (wallet.locked_until && new Date() < new Date(wallet.locked_until)) {
      throw new Error(`Wallet is locked until ${new Date(wallet.locked_until).toLocaleTimeString()}`);
    } else {
      // Auto-unlock if lock period expired
      await supabase
        .from('wallets')
        .update({ is_locked: false, failed_pin_attempts: 0 })
        .eq('user_id', userId);
    }
  }

  // Verify PIN
  const isValid = await bcrypt.compare(pin, wallet.pin_hash);

  if (!isValid) {
    // Increment failed attempts
    const newAttempts = (wallet.failed_pin_attempts || 0) + 1;
    const updates: any = { failed_pin_attempts: newAttempts };

    // Lock wallet after 5 failed attempts
    if (newAttempts >= 5) {
      updates.is_locked = true;
      updates.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
    }

    await supabase
      .from('wallets')
      .update(updates)
      .eq('user_id', userId);

    await logAuditEvent({
      user_id: userId,
      action: 'pin_failed',
      entity_type: 'wallet',
      success: false,
    });

    throw new Error(`Invalid PIN. ${5 - newAttempts} attempts remaining.`);
  }

  // Clear failed attempts on success
  await supabase
    .from('wallets')
    .update({ failed_pin_attempts: 0 })
    .eq('user_id', userId);

  await logAuditEvent({
    user_id: userId,
    action: 'pin_verified',
    entity_type: 'wallet',
    success: true,
  });

  return true;
}

// Audit logging
async function logAuditEvent(event: {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}) {
  try {
    await supabase.from('audit_logs').insert([event]);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Rate limiting helpers
async function getRecentFailedAttempts(email: string): Promise<number> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('created_at', fifteenMinutesAgo.toISOString());

  return count || 0;
}

async function getLockoutTime(email: string): Promise<Date | null> {
  const { data } = await supabase
    .from('login_attempts')
    .select('locked_until')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.locked_until ? new Date(data.locked_until) : null;
}

async function logFailedAttempt(email: string, ip_address?: string) {
  await supabase.from('login_attempts').insert([
    {
      email,
      success: false,
      ip_address,
      created_at: new Date().toISOString(),
    },
  ]);
}

async function clearFailedAttempts(email: string) {
  await supabase
    .from('login_attempts')
    .delete()
    .eq('email', email);
}

// Phone number normalization
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if missing (Uganda: +256)
  if (!cleaned.startsWith('256') && !cleaned.startsWith('+256')) {
    if (cleaned.startsWith('0')) {
      cleaned = '256' + cleaned.substring(1);
    } else {
      cleaned = '256' + cleaned;
    }
  }

  return '+' + cleaned.replace(/^\+/, '');
}

export async function updateProfile(userId: string, updates: Partial<AuthUser>) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}
