import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Children } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BrandGradient, BrandGradientLocations, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';

// One bottom nav for web AND native: Discover · Tickets · [+] · Friends ·
// Venues · Profile, with the signature green gradient FAB. Discover/Profile
// are tabs; the rest push their stack routes.
export function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <BottomBar>
          <TabTrigger name="index" href="/" asChild>
            <NavItem icon="✦" label="Discover" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <NavItem icon="◐" label="Profile" />
          </TabTrigger>
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

function NavItem({
  icon,
  label,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: string; label: string }) {
  return (
    <Pressable {...props} style={styles.item}>
      <ThemedText style={[styles.icon, { opacity: isFocused ? 1 : 0.55 }]}>{icon}</ThemedText>
      <ThemedText type="small" numberOfLines={1} themeColor={isFocused ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function StaticItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <ThemedText style={[styles.icon, { opacity: 0.55 }]}>{icon}</ThemedText>
      <ThemedText type="small" numberOfLines={1} themeColor="textSecondary">
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Fab() {
  return (
    <Pressable onPress={() => router.push('/create-event')} style={styles.fabWrap}>
      <LinearGradient
        colors={BrandGradient}
        locations={BrandGradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}>
        <ThemedText style={styles.fabPlus}>+</ThemedText>
      </LinearGradient>
    </Pressable>
  );
}

function BottomBar(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const kids = Children.toArray(props.children);
  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}
      pointerEvents="box-none">
      <View style={styles.bar}>
        {kids[0]}
        <StaticItem icon="🎟" label="Tickets" onPress={() => router.push('/tickets')} />
        <Fab />
        <StaticItem icon="👯" label="Friends" onPress={() => router.push('/friends')} />
        <StaticItem icon="🍸" label="Venues" onPress={() => router.push('/venues')} />
        {kids[1]}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23,23,31,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 26,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.one,
  },
  item: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    minWidth: 44,
    flexShrink: 1,
  },
  icon: {
    fontSize: 18,
  },
  fabWrap: {
    marginTop: -28,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: {
    color: OnBrand,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
});
