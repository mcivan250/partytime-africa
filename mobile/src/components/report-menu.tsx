import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { tapLight, tapSuccess } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Report / block control for user-generated content (feed posts, replies, DMs,
// profiles). Required by App Store 1.2 and Google Play UGC policy: every piece
// of user content must be reportable, and users must be able to block others.
const REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech',
  'Nudity or sexual content',
  'Violence or threats',
  'Scam or fraud',
  'Something else',
];

export function ReportMenu({
  targetType,
  targetId,
  targetOwnerId,
  targetName,
  onBlocked,
  tint = '#94A697',
}: {
  targetType: 'feed_post' | 'feed_reply' | 'dm' | 'comment' | 'user' | 'event';
  targetId: string | null;
  targetOwnerId: string | null;
  targetName: string;
  onBlocked?: () => void;
  tint?: string;
}) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'menu' | 'reasons' | 'done'>('menu');
  const [busy, setBusy] = useState(false);

  // Don't offer moderation on your own content.
  if (!session || (targetOwnerId && targetOwnerId === session.user.id)) return null;

  const close = () => {
    setOpen(false);
    setStage('menu');
  };

  const report = async (reason: string) => {
    setBusy(true);
    await supabase.rpc('report_content', {
      p_type: targetType,
      p_id: targetId,
      p_owner: targetOwnerId,
      p_reason: reason,
      p_note: null,
    });
    setBusy(false);
    tapSuccess();
    setStage('done');
  };

  const block = async () => {
    if (!targetOwnerId) return;
    setBusy(true);
    await supabase.rpc('block_user', { p_id: targetOwnerId });
    setBusy(false);
    tapSuccess();
    close();
    onBlocked?.();
  };

  return (
    <>
      <Pressable
        hitSlop={10}
        onPress={() => {
          tapLight();
          setOpen(true);
        }}
        accessibilityLabel="Report or block">
        <ThemedText style={[styles.dots, { color: tint }]}>⋯</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheetWrap} onPress={(e) => e.stopPropagation()}>
            <ThemedView type="backgroundElement" style={styles.sheet}>
              {stage === 'menu' ? (
                <>
                  <ThemedText type="smallBold" style={styles.sheetTitle}>
                    {targetName}
                  </ThemedText>
                  <Pressable style={styles.item} disabled={busy} onPress={() => setStage('reasons')}>
                    <ThemedText type="smallBold" style={styles.report}>
                      🚩 Report {targetType === 'user' ? 'this account' : 'this content'}
                    </ThemedText>
                  </Pressable>
                  {targetOwnerId ? (
                    <Pressable style={styles.item} disabled={busy} onPress={block}>
                      <ThemedText type="smallBold" style={styles.report}>
                        🚫 Block {targetName}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        You won&apos;t see their posts or hear from them.
                      </ThemedText>
                    </Pressable>
                  ) : null}
                  <Pressable style={[styles.item, styles.cancel]} onPress={close}>
                    <ThemedText type="smallBold">Cancel</ThemedText>
                  </Pressable>
                </>
              ) : stage === 'reasons' ? (
                <>
                  <ThemedText type="smallBold" style={styles.sheetTitle}>
                    Why are you reporting this?
                  </ThemedText>
                  {REASONS.map((r) => (
                    <Pressable key={r} style={styles.item} disabled={busy} onPress={() => report(r)}>
                      <ThemedText type="smallBold">{r}</ThemedText>
                    </Pressable>
                  ))}
                  <Pressable style={[styles.item, styles.cancel]} onPress={() => setStage('menu')}>
                    <ThemedText type="smallBold">Back</ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText type="smallBold" style={styles.sheetTitle}>
                    ✓ Thanks — we&apos;ll review it
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.doneBody}>
                    Our team reviews reports and removes content that breaks the rules. If you feel
                    unsafe, you can also block this person.
                  </ThemedText>
                  {targetOwnerId ? (
                    <Pressable style={styles.item} disabled={busy} onPress={block}>
                      <ThemedText type="smallBold" style={styles.report}>
                        🚫 Block {targetName}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                  <Pressable style={[styles.item, styles.cancel]} onPress={close}>
                    <ThemedText type="smallBold">Done</ThemedText>
                  </Pressable>
                </>
              )}
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dots: {
    fontSize: 22,
    lineHeight: 22,
    paddingHorizontal: Spacing.one,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    padding: Spacing.three,
  },
  sheet: {
    borderRadius: 20,
    padding: Spacing.two,
    gap: Spacing.one,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  sheetTitle: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  item: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: 2,
  },
  report: {
    color: '#F73558',
  },
  cancel: {
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  doneBody: {
    paddingHorizontal: Spacing.three,
    lineHeight: 19,
    marginBottom: Spacing.one,
  },
});
