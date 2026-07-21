import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, WebBottomNavInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

function AuthForm() {
  const theme = useTheme();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName.trim() } },
          });
    if (error) {
      setMessage(error.message);
    } else if (mode === 'sign-up') {
      setMessage('Account created. Check your email if confirmation is required.');
    }
    setBusy(false);
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="subtitle">
        {mode === 'sign-in' ? 'Sign in' : 'Create your account'}
      </ThemedText>
      {mode === 'sign-up' && (
        <TextInput
          style={inputStyle}
          placeholder="Display name"
          placeholderTextColor={theme.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={inputStyle}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={inputStyle}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {message && <ThemedText type="small">{message}</ThemedText>}
      <Pressable style={[styles.button, { opacity: busy ? 0.5 : 1 }]} onPress={submit} disabled={busy}>
        <ThemedText type="smallBold" style={styles.buttonLabel}>
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </ThemedText>
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
        <ThemedText type="link">
          {mode === 'sign-in' ? "New here? Create an account" : 'Already have an account? Sign in'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function ProfileCard() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [session]);

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="subtitle">{profile?.display_name ?? 'Your profile'}</ThemedText>
      <ThemedText type="small">{session?.user.email}</ThemedText>
      {profile?.city && <ThemedText type="small">{profile.city}</ThemedText>}
      <Pressable style={styles.button} onPress={() => router.push('/my-events')}>
        <ThemedText type="smallBold" style={styles.buttonLabel}>
          My events
        </ThemedText>
      </Pressable>
      <Pressable style={styles.buttonGhost} onPress={() => router.push('/tickets')}>
        <ThemedText type="smallBold">My tickets</ThemedText>
      </Pressable>
      <Pressable style={styles.buttonGhost} onPress={() => supabase.auth.signOut()}>
        <ThemedText type="smallBold">Sign out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export default function ProfileScreen() {
  const { session, loading } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.heading}>
          Profile
        </ThemedText>
        {loading ? <ActivityIndicator /> : session ? <ProfileCard /> : <AuthForm />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: WebBottomNavInset,
    alignSelf: 'stretch',
  },
  heading: {
    paddingVertical: Spacing.three,
  },
  formCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8884',
  },
  buttonLabel: {
    color: OnBrand,
  },
  button: {
    backgroundColor: Brand,
    borderRadius: 999,
    padding: Spacing.three,
    alignItems: 'center',
  },
  buttonGhost: {
    backgroundColor: '#243527',
    borderRadius: 999,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
