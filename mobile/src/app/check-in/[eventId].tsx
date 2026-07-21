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

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, attendee_name, status, ticket_tiers(name)')
      .eq('qr_code', qr)
      .eq('event_id', eventId)
      .maybeSingle();

    if (!ticket) {
      setResult({ kind: 'error', text: 'Ticket not found for this event.' });
    } else if (ticket.status === 'void') {
      setResult({ kind: 'error', text: `${ticket.attendee_name}: ticket is void.` });
    } else if (ticket.status === 'checked_in') {
      setResult({ kind: 'warn', text: `${ticket.attendee_name} is already checked in.` });
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          checked_in_by: userData.user?.id ?? null,
        })
        .eq('id', ticket.id);
      if (error) {
        setResult({ kind: 'error', text: 'Could not check in — are you the host?' });
      } else {
        const tier = (ticket.ticket_tiers as { name: string } | null)?.name;
        setResult({ kind: 'ok', text: `✓ ${ticket.attendee_name} in${tier ? ` · ${tier}` : ''}` });
        setCount((c) => c + 1);
      }
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
