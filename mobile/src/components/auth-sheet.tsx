import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, OnBrand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

// Inline sign-in / sign-up presented at the point of action (e.g. checkout) so
// people don't get bounced to the Profile tab and lose what they were buying.
// On a successful sign-in the parent's session updates and it resumes the
// pending action; new sign-ups get the confirm-email step right here.
function authRedirectTo() {
  return Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://partytime.africa';
}

export function AuthSheet({
  visible,
  onClose,
  headline = 'Sign in to continue',
  sub = 'Your ticket is one step away — sign in or create an account to check out.',
}: {
  visible: boolean;
  onClose: () => void;
  headline?: string;
  sub?: string;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const submit = async () => {
    if (mode === 'sign-up' && phone.trim().replace(/\D/g, '').length < 9) {
      setMessage('Enter a valid phone number — we use it for your tickets & updates.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName.trim(), phone: phone.trim() },
              emailRedirectTo: authRedirectTo(),
            },
          });
    if (error) {
      setMessage(error.message);
    } else if (mode === 'sign-up') {
      setPendingEmail(email.trim());
      setMessage(null);
      track('sign_up');
    }
    // On sign-in success the auth listener updates the session; the parent
    // closes this sheet and resumes checkout.
    setBusy(false);
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={(e) => e.stopPropagation()}>
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
              <View style={styles.handle} />
              {pendingEmail ? (
                <>
                  <ThemedText style={styles.glyph}>📩</ThemedText>
                  <ThemedText type="subtitle" style={styles.center}>
                    Confirm your email
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centerBody}>
                    We sent a link to {pendingEmail}. Tap it to verify, then come back and sign in to
                    finish your purchase.
                  </ThemedText>
                  <Pressable
                    style={styles.cta}
                    onPress={() => {
                      setPendingEmail(null);
                      setMode('sign-in');
                      setMessage(null);
                    }}>
                    <ThemedText type="smallBold" style={styles.ctaLabel}>
                      Back to sign in
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText type="subtitle" style={styles.center}>
                    {headline}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centerBody}>
                    {sub}
                  </ThemedText>
                  {mode === 'sign-up' ? (
                    <>
                      <TextInput
                        style={inputStyle}
                        placeholder="Display name"
                        placeholderTextColor={theme.textSecondary}
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="words"
                      />
                      <TextInput
                        style={inputStyle}
                        placeholder="Phone number (for tickets & updates)"
                        placeholderTextColor={theme.textSecondary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                      />
                    </>
                  ) : null}
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
                  {message ? <ThemedText type="small">{message}</ThemedText> : null}
                  <Pressable style={[styles.cta, busy && styles.disabled]} disabled={busy} onPress={submit}>
                    <ThemedText type="smallBold" style={styles.ctaLabel}>
                      {mode === 'sign-in' ? 'Sign in & continue' : 'Create account'}
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
                    <ThemedText type="link" style={styles.switch}>
                      {mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
                    </ThemedText>
                  </Pressable>
                </>
              )}
              <Pressable style={styles.cancel} onPress={onClose}>
                <ThemedText type="small" themeColor="textSecondary">
                  Not now
                </ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '90%',
  },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.one,
  },
  glyph: { fontSize: 40, textAlign: 'center' },
  center: { textAlign: 'center' },
  centerBody: { textAlign: 'center', lineHeight: 20 },
  input: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cta: { backgroundColor: Brand, borderRadius: 999, padding: Spacing.three, alignItems: 'center' },
  ctaLabel: { color: OnBrand },
  disabled: { opacity: 0.5 },
  switch: { textAlign: 'center' },
  cancel: { alignItems: 'center', paddingVertical: Spacing.two },
});
