import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BodyFontBold,
  BottomNavInset,
  Brand,
  BrandGradient,
  BrandGradientLocations,
  DisplayFont,
  Gold,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { pickImage, uploadImage } from '@/lib/storage';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

// Confirmation links should return people to the live web app (or the current
// origin on web), never a dev/localhost URL.
function authRedirectTo() {
  return Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://partytime.africa';
}

function AuthForm() {
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
      setMessage('Enter a valid phone number — we use it for tickets & event updates.');
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
      // If confirmation is required there's no session yet — show the
      // "check your email" screen so it's obvious what to do next.
      setPendingEmail(email.trim());
      setMessage(null);
      track('sign_up');
    }
    setBusy(false);
  };

  const resend = async () => {
    if (!pendingEmail) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingEmail,
      options: { emailRedirectTo: authRedirectTo() },
    });
    setBusy(false);
    setMessage(error ? error.message : 'Sent again — check your inbox (and spam).');
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.background },
  ];

  return (
    <View style={styles.authWrap}>
      <View style={styles.authHero}>
        <LinearGradient
          colors={BrandGradient}
          locations={BrandGradientLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.authBadge}>
          <ThemedText style={styles.authBadgeGlyph}>✦</ThemedText>
        </LinearGradient>
        <ThemedText style={styles.authTitle}>
          {mode === 'sign-in' ? 'Welcome back' : 'Join the party'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.authSub}>
          {mode === 'sign-in'
            ? 'Your tickets, your events, your people — all in one place.'
            : 'Host nights out, sell tickets, and keep your crew close.'}
        </ThemedText>
      </View>

      {pendingEmail ? (
        <ThemedView type="backgroundElement" style={styles.formCard}>
          <ThemedText style={styles.confirmGlyph}>📩</ThemedText>
          <ThemedText type="subtitle" style={styles.confirmTitle}>
            Confirm your email
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.confirmBody}>
            We sent a link to {pendingEmail}. Tap it to verify your email, then come back here and
            sign in. Check spam if it&apos;s not there in a minute.
          </ThemedText>
          {message ? (
            <ThemedText type="small" style={styles.confirmBody}>
              {message}
            </ThemedText>
          ) : null}
          <Pressable style={[styles.cta, { opacity: busy ? 0.5 : 1 }]} onPress={resend} disabled={busy}>
            <ThemedText type="smallBold" style={styles.ctaLabel}>
              Resend email
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              setPendingEmail(null);
              setMessage(null);
              setMode('sign-in');
            }}>
            <ThemedText type="link" style={styles.authSwitch}>
              Back to sign in
            </ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
      <ThemedView type="backgroundElement" style={styles.formCard}>
        {mode === 'sign-up' && (
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
        <Pressable style={[styles.cta, { opacity: busy ? 0.5 : 1 }]} onPress={submit} disabled={busy}>
          <ThemedText type="smallBold" style={styles.ctaLabel}>
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
          <ThemedText type="link" style={styles.authSwitch}>
            {mode === 'sign-in' ? "New here? Create an account" : 'Already have an account? Sign in'}
          </ThemedText>
        </Pressable>
      </ThemedView>
      )}
    </View>
  );
}

// Visible build marker — bumped every ship. If you can read this at the
// bottom of the Profile, you are on this build; if it's absent, the surface
// is running an older cached bundle and needs a redeploy/reload.
const BUILD_TAG = 'build 2026.07.26 · sentry+cleanup';

type Stats = { hosting: number; going: number; tickets: number };
type NextEvent = {
  slug: string;
  title: string;
  starts_at: string | null;
  cover_url: string | null;
  venue_name: string | null;
  timezone: string;
  role: 'hosting' | 'going';
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statTile}>
      <ThemedText style={[styles.statNum, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function ActionRow({
  glyph,
  title,
  subtitle,
  onPress,
  last,
}: {
  glyph: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}>
      <View style={styles.rowIcon}>
        <ThemedText style={styles.rowGlyph}>{glyph}</ThemedText>
      </View>
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      <ThemedText style={styles.chevron}>›</ThemedText>
    </Pressable>
  );
}

function Dashboard() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [stats, setStats] = useState<Stats>({ hosting: 0, going: 0, tickets: 0 });
  const [next, setNext] = useState<NextEvent | null>(null);
  const [unread, setUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ownsVenue, setOwnsVenue] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const theme = useTheme();

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const [profileRes, hostingRes, goingRes, ticketsRes, hostUpcoming, goingUpcoming, unreadRes] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('host_id', uid),
        supabase
          .from('rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', uid)
          .eq('status', 'going'),
        supabase
          .from('tickets')
          .select('id, orders!inner(profile_id)', { count: 'exact', head: true })
          .eq('orders.profile_id', uid),
        supabase
          .from('events')
          .select('slug, title, starts_at, cover_url, venue_name, timezone')
          .eq('host_id', uid)
          .gte('starts_at', now)
          .order('starts_at', { ascending: true })
          .limit(1),
        supabase
          .from('rsvps')
          .select('events!inner(slug, title, starts_at, cover_url, venue_name, timezone)')
          .eq('profile_id', uid)
          .eq('status', 'going')
          .gte('events.starts_at', now)
          .limit(5),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .is('read_at', null),
      ]);

    if (profileRes.data) setProfile(profileRes.data);
    setUnread(unreadRes.count ?? 0);
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true));
    supabase.rpc('my_owned_venue').then(({ data }) => setOwnsVenue((data ?? []).length > 0));
    setStats({
      hosting: hostingRes.count ?? 0,
      going: goingRes.count ?? 0,
      tickets: ticketsRes.count ?? 0,
    });

    // Pick the soonest of "hosting next" vs "going next".
    const candidates: NextEvent[] = [];
    const h = hostUpcoming.data?.[0];
    if (h) candidates.push({ ...h, role: 'hosting' } as NextEvent);
    for (const row of (goingUpcoming.data ?? []) as { events?: Omit<NextEvent, 'role'> }[]) {
      if (row.events) candidates.push({ ...row.events, role: 'going' });
    }
    candidates.sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''));
    setNext(candidates[0] ?? null);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const savePhone = async () => {
    if (phoneInput.trim().replace(/\D/g, '').length < 9) return;
    setSavingPhone(true);
    await supabase.from('profiles').update({ phone: phoneInput.trim() }).eq('id', uid);
    setProfile((p) => (p ? { ...p, phone: phoneInput.trim() } : p));
    setSavingPhone(false);
  };

  const changeAvatar = async () => {
    try {
      const image = await pickImage([1, 1]);
      if (!image) return;
      setUploading(true);
      const { url } = await uploadImage('avatars', uid, image);
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', uid);
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
    } catch {
      // ignore — keeps the existing photo
    } finally {
      setUploading(false);
    }
  };

  const name = profile?.display_name || session!.user.email?.split('@')[0] || 'You';
  const handle = profile?.username ? `@${profile.username}` : session!.user.email;
  const since = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;
  const meta = [profile?.city, since ? `Since ${since}` : null].filter(Boolean).join('  ·  ');

  return (
    <ScrollView contentContainerStyle={styles.dashboard} showsVerticalScrollIndicator={false}>
      {/* Identity hero */}
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(29,201,107,0.20)', 'transparent']}
          style={styles.heroGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <Pressable onPress={changeAvatar} style={styles.avatarRing}>
          <LinearGradient
            colors={BrandGradient}
            locations={BrandGradientLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRingGradient}>
            <View style={styles.avatarInner}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <ThemedText style={styles.avatarInitials}>{initialsOf(name)}</ThemedText>
              )}
            </View>
          </LinearGradient>
          <View style={styles.avatarBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={OnBrand} />
            ) : (
              <ThemedText style={styles.avatarBadgeGlyph}>📷</ThemedText>
            )}
          </View>
        </Pressable>
        <ThemedText style={styles.name}>{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {handle}
        </ThemedText>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
            {meta}
          </ThemedText>
        ) : null}
      </View>

      {profile && !profile.phone ? (
        <ThemedView type="backgroundElement" style={styles.phoneCard}>
          <ThemedText type="smallBold">📱 Add your number</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            We use it for your tickets and event updates — never spam.
          </ThemedText>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.phoneInput, { color: theme.text, backgroundColor: theme.background }]}
              placeholder="e.g. 0772 123 456"
              placeholderTextColor={theme.textSecondary}
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
            />
            <Pressable
              style={[styles.phoneSave, { opacity: savingPhone ? 0.5 : 1 }]}
              disabled={savingPhone}
              onPress={savePhone}>
              <ThemedText type="smallBold" style={styles.ctaLabel}>
                Save
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      ) : null}

      {/* Stats */}
      <View style={styles.statRow}>
        <StatTile value={stats.hosting} label="HOSTING" color={Gold} />
        <StatTile value={stats.going} label="GOING" color={StateGo} />
        <StatTile value={stats.tickets} label="TICKETS" color={Brand} />
      </View>

      {/* Next night out */}
      {next ? (
        <Pressable
          onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: next.slug } })}
          style={({ pressed }) => [styles.nextCard, pressed && styles.rowPressed]}>
          {next.cover_url ? (
            <Image source={{ uri: next.cover_url }} style={styles.nextThumb} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={BrandGradient}
              locations={BrandGradientLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextThumb}
            />
          )}
          <View style={styles.flex}>
            <ThemedText style={styles.nextKicker}>
              {next.role === 'hosting' ? "YOU'RE HOSTING" : "YOU'RE GOING"}
            </ThemedText>
            <ThemedText type="smallBold" numberOfLines={1}>
              {next.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {next.starts_at
                ? new Date(next.starts_at).toLocaleString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: next.timezone,
                  })
                : 'Date TBA'}
              {next.venue_name ? `  ·  ${next.venue_name}` : ''}
            </ThemedText>
          </View>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </Pressable>
      ) : null}

      {/* Actions */}
      <ThemedView type="backgroundElement" style={styles.actionCard}>
        <ActionRow
          glyph="🔔"
          title="Notifications"
          subtitle={unread > 0 ? `${unread} new` : 'Replies & earnings'}
          onPress={() => router.push('/notifications')}
        />
        <ActionRow
          glyph="✦"
          title="My events"
          subtitle="Events you host & manage"
          onPress={() => router.push('/my-events')}
        />
        <ActionRow
          glyph="🎟"
          title="My tickets"
          subtitle="Passes & merch pickups"
          onPress={() => router.push('/tickets')}
        />
        <ActionRow
          glyph="💸"
          title="Promoter earnings"
          subtitle="Share events, earn a cut"
          onPress={() => router.push('/promotions')}
        />
        {ownsVenue ? (
          <ActionRow
            glyph="🍽️"
            title="My venue"
            subtitle="Edit details, photos & bookings"
            onPress={() => router.push('/my-venue')}
          />
        ) : null}
        <ActionRow
          glyph="+"
          title="Host an event"
          subtitle="Start selling in minutes"
          onPress={() => router.push('/create-event')}
          last={!isAdmin}
        />
        {isAdmin ? (
          <ActionRow
            glyph="📊"
            title="Ops Copilot"
            subtitle="Ask your data anything"
            onPress={() => router.push('/ops')}
          />
        ) : null}
        {isAdmin ? (
          <ActionRow
            glyph="🛡️"
            title="Moderation"
            subtitle="Members & content"
            onPress={() => router.push('/admin')}
            last
          />
        ) : null}
      </ThemedView>

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Sign out
        </ThemedText>
      </Pressable>

      <ThemedText style={styles.buildTag}>{BUILD_TAG}</ThemedText>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  const { session, loading } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : session ? (
          <Dashboard />
        ) : (
          <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
            <AuthForm />
          </ScrollView>
        )}
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
    width: '100%',
    paddingHorizontal: Spacing.four,
    alignSelf: 'stretch',
  },
  loader: {
    marginTop: Spacing.six,
  },
  flex: {
    flex: 1,
  },

  // Dashboard
  dashboard: {
    paddingBottom: BottomNavInset,
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  avatarRing: {
    marginBottom: Spacing.two,
  },
  avatarRingGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  avatarInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#19231B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: DisplayFont,
    fontSize: 30,
    color: '#EFF6EE',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#111811',
  },
  avatarBadgeGlyph: {
    fontSize: 13,
    color: OnBrand,
  },
  name: {
    fontFamily: DisplayFont,
    fontSize: 28,
    color: '#EFF6EE',
    textAlign: 'center',
  },
  meta: {
    marginTop: Spacing.half,
  },

  phoneCard: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(29,201,107,0.3)',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  phoneInput: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  phoneSave: {
    backgroundColor: Brand,
    borderRadius: 14,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontFamily: DisplayFont,
    fontSize: 26,
  },
  statLabel: {
    fontFamily: BodyFontBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#94A697',
  },

  // Next event
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.25)',
    borderRadius: 20,
    padding: Spacing.three,
  },
  nextThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  nextKicker: {
    fontFamily: BodyFontBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Gold,
    marginBottom: 2,
  },

  // Action list
  actionCard: {
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(29,201,107,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowGlyph: {
    fontSize: 18,
    color: StateGo,
  },
  chevron: {
    fontSize: 26,
    color: '#94A697',
    marginLeft: Spacing.two,
  },

  signOut: {
    alignSelf: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  buildTag: {
    alignSelf: 'center',
    fontSize: 11,
    color: '#5A6B5E',
    marginBottom: Spacing.two,
  },

  // Auth (signed-out)
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: BottomNavInset,
  },
  authWrap: {
    gap: Spacing.four,
  },
  authHero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.five,
  },
  authBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    shadowColor: Brand,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  authBadgeGlyph: {
    fontSize: 34,
    color: OnBrand,
  },
  authTitle: {
    fontFamily: DisplayFont,
    fontSize: 30,
    color: '#EFF6EE',
    textAlign: 'center',
  },
  authSub: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.four,
  },
  authSwitch: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  confirmGlyph: {
    fontSize: 40,
    textAlign: 'center',
  },
  confirmTitle: {
    textAlign: 'center',
  },
  confirmBody: {
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cta: {
    backgroundColor: Brand,
    borderRadius: 999,
    padding: Spacing.three,
    alignItems: 'center',
  },
  ctaLabel: {
    color: OnBrand,
  },
});
