import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
  phone_number?: string;
  name: string;
  profile_photo_url?: string;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Check if user profile already exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', authData.user.id)
    .single();

  // Only create profile if it doesn't exist
  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
        },
      ]);

    if (profileError && profileError.code !== '23505') {
      // Ignore duplicate key error, throw others
      throw profileError;
    }

    // Create wallet after profile is created
    await createWallet(authData.user.id);
  }

  return authData.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) throw error;
  return data;
}

export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw error;
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
    phone_number: profile.phone_number,
    name: profile.name,
    profile_photo_url: profile.profile_photo_url,
  };
}

export async function updateProfile(userId: string, updates: Partial<AuthUser>) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

// Create wallet on user signup
export async function createWallet(userId: string) {
  // Check if wallet already exists
  const { data: existingWallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingWallet) {
    // Wallet already exists, skip creation
    return;
  }

  // Verify user exists first
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!user) {
    console.error('Cannot create wallet: user does not exist');
    return;
  }

  const { error } = await supabase
    .from('wallets')
    .insert([
      {
        user_id: userId,
        balance_cents: 0,
        currency: 'USD',
        verification_tier: 1,
        daily_limit_cents: 5000, // $50 for new users
      },
    ]);

  if (error && error.code !== '23505') { // Ignore duplicate key error
    console.error('Error creating wallet:', error);
    // Don't throw - wallet creation is optional, shouldn't block signup
  }
}
