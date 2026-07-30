// Phone verification via WhatsApp OTP. Self-contained: reads/writes the signed
// -in user's profile. Gated by EXPO_PUBLIC_PHONE_VERIFY_ENABLED at the call
// site so it stays hidden until the WhatsApp Business setup is live.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Stage = 'loading' | 'enter' | 'code' | 'verified';

export function PhoneVerify() {
  const theme = useTheme();
  const { session } = useAuth();
  const uid = session?.user.id;
  const [stage, setStage] = useState<Stage>('loading');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comingSoon, setComingSoon] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('profiles')
      .select('phone, phone_verified, wa_opt_in')
      .eq('id', uid)
      .maybeSingle();
    if (data?.phone_verified) {
      setPhone(data.phone ?? '');
      setOptIn(data.wa_opt_in);
      setStage('verified');
    } else {
      setPhone(data?.phone ?? '');
      setStage('enter');
    }
  }, [uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const sendCode = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Enter your WhatsApp number first.');
      return;
    }
    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke('send-otp', {
      body: { phone: phone.trim() },
    });
    setBusy(false);
    if (fnError || data?.error) {
      // 503 = the WhatsApp Business setup isn't live yet.
      if (data?.error && /not switched on/i.test(String(data.error))) {
        setComingSoon(true);
        return;
      }
      setError(data?.error || 'Could not send the code. Try again.');
      return;
    }
    setStage('code');
  };

  const verify = async () => {
    setError(null);
    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke('verify-otp', {
      body: { phone: phone.trim(), code: code.trim() },
    });
    setBusy(false);
    if (fnError || data?.error) {
      setError(data?.error || 'Could not verify. Try again.');
      return;
    }
    setCode('');
    setStage('verified');
  };

  const toggleOptIn = async (v: boolean) => {
    setOptIn(v);
    if (uid) await supabase.from('profiles').update({ wa_opt_in: v }).eq('id', uid);
  };

  if (!uid || stage === 'loading') return null;

  if (comingSoon) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">💬 WhatsApp updates — coming soon</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          We&apos;re setting up WhatsApp so you can verify your number and get event updates. Check
          back shortly.
        </ThemedText>
      </ThemedView>
    );
  }

  if (stage === 'verified') {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold" style={styles.okText}>
          ✓ WhatsApp number verified
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {phone}
        </ThemedText>
        <View style={styles.optRow}>
          <ThemedText type="small" style={styles.flex}>
            Get event updates on WhatsApp
          </ThemedText>
          <Switch
            value={optIn}
            onValueChange={toggleOptIn}
            trackColor={{ true: StateGo, false: '#3a4a3d' }}
            thumbColor={OnBrand}
          />
        </View>
        <Pressable
          onPress={() => {
            setCode('');
            setStage('enter');
          }}>
          <ThemedText type="link">Change number</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">💬 Verify your number on WhatsApp</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        We&apos;ll send a one-time code to your WhatsApp. Verified guests get their tickets and event
        updates there.
      </ThemedText>

      {stage === 'enter' ? (
        <>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
              placeholder="e.g. 0772 123 456"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <Pressable
              style={[styles.cta, { opacity: busy ? 0.5 : 1 }]}
              disabled={busy}
              onPress={sendCode}>
              {busy ? (
                <ActivityIndicator size="small" color={OnBrand} />
              ) : (
                <ThemedText type="smallBold" style={styles.ctaLabel}>
                  Send code
                </ThemedText>
              )}
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.consent}>
            By verifying, you agree to receive event updates on WhatsApp. You can opt out anytime.
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Enter the code we sent to {phone}.
          </ThemedText>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.codeInput, { color: theme.text, backgroundColor: theme.background }]}
              placeholder="6-digit code"
              placeholderTextColor={theme.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />
            <Pressable
              style={[styles.cta, { opacity: busy ? 0.5 : 1 }]}
              disabled={busy}
              onPress={verify}>
              {busy ? (
                <ActivityIndicator size="small" color={OnBrand} />
              ) : (
                <ThemedText type="smallBold" style={styles.ctaLabel}>
                  Verify
                </ThemedText>
              )}
            </Pressable>
          </View>
          <View style={styles.subRow}>
            <Pressable onPress={sendCode} disabled={busy}>
              <ThemedText type="link">Resend code</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                setCode('');
                setError(null);
                setStage('enter');
              }}>
              <ThemedText type="small" themeColor="textSecondary">
                Change number
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}

      {error ? (
        <ThemedText type="small" style={styles.errText}>
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: Spacing.four, gap: Spacing.two },
  okText: { color: StateGo },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  input: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  codeInput: { letterSpacing: 4, fontSize: 18 },
  cta: {
    backgroundColor: Brand,
    borderRadius: 14,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
    minWidth: 96,
    alignItems: 'center',
  },
  ctaLabel: { color: OnBrand },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  flex: { flex: 1 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  consent: { lineHeight: 18, marginTop: Spacing.one },
  errText: { color: Gold },
});
