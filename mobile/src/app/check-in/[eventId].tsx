import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo, StateMaybe } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Result = { kind: 'ok' | 'warn' | 'error'; text: string };

export default function CheckInScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState('');
  const [count, setCount] = useState(0);
  const busyRef = useRef(false);

  const checkIn = async (code: string) => {
    const qr = code.trim();
    if (!qr || busyRef.current) return;
    busyRef.current = true;

    // Verification runs server-side (check-in-ticket): it validates rotating
    // signed tokens, accepts legacy static codes, and marks the ticket used.
    const { data, error } = await supabase.functions.invoke('check-in-ticket', {
      body: { code: qr, event_id: eventId },
    });
    if (error || !data || data.error) {
      setResult({ kind: 'error', text: (data && data.error) || 'Could not check in — try again.' });
    } else {
      const kind = (data.kind as Result['kind']) ?? 'error';
      // Flag ok scans that used a static (screenshot-able) code, not a live one.
      const text = kind === 'ok' && data.live === false ? `${data.text}  ⚠︎ static code` : data.text;
      setResult({ kind, text });
      if (kind === 'ok') setCount((c) => c + 1);
    }
    setManual('');
    // Brief lock so a held QR code doesn't fire repeatedly.
    setTimeout(() => {
      busyRef.current = false;
    }, 1800);
  };

  const resultColor =
    result?.kind === 'ok' ? StateGo : result?.kind === 'warn' ? StateMaybe : '#F73558';

  const cameraAvailable = Platform.OS !== 'web';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title">Check-in</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Scan a guest&apos;s ticket QR, or enter the code by hand. {count} checked in this session.
        </ThemedText>

        {cameraAvailable ? (
          permission?.granted ? (
            <View style={styles.scanner}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => checkIn(data)}
              />
              <View style={styles.reticle} />
            </View>
          ) : (
            <Pressable style={styles.primary} onPress={requestPermission}>
              <ThemedText type="smallBold" style={styles.primaryLabel}>
                Enable camera to scan
              </ThemedText>
            </Pressable>
          )
        ) : (
          <ThemedView type="backgroundElement" style={styles.webNote}>
            <ThemedText type="small" themeColor="textSecondary">
              Camera scanning works in the phone app. On the web, enter the ticket code below.
            </ThemedText>
          </ThemedView>
        )}

        {result ? (
          <ThemedView type="backgroundElement" style={[styles.result, { borderColor: resultColor }]}>
            <ThemedText type="smallBold" style={{ color: resultColor }}>
              {result.text}
            </ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.manualRow}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Ticket code"
            placeholderTextColor={theme.textSecondary}
            value={manual}
            onChangeText={setManual}
            autoCapitalize="none"
          />
          <Pressable style={styles.primary} onPress={() => checkIn(manual)}>
            <ThemedText type="smallBold" style={styles.primaryLabel}>
              Check in
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scanner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  reticle: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    bottom: '15%',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
  webNote: {
    borderRadius: 16,
    padding: Spacing.four,
  },
  result: {
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1.5,
  },
  manualRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  primary: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  primaryLabel: {
    color: OnBrand,
  },
});
