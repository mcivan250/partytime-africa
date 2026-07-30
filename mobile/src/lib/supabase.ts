import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // On web (including expo-router static rendering in Node, where there is
    // no window), fall back to supabase-js's own SSR-safe storage handling.
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    // On web, parse the tokens Supabase appends when someone returns from an
    // email confirmation link so they're logged in automatically (and the URL
    // is cleaned up). Native uses its own deep-link handling, so keep it off.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Supabase recommends only refreshing auth tokens while the app is foregrounded.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export type { Database };
