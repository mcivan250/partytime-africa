import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Children } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { BrandGradient, BrandGradientLocations, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';

export default function AppTabs() {
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
      <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function StaticItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <ThemedText style={[styles.icon, { opacity: 0.55 }]}>{icon}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
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

// The two TabTriggers arrive as children; we interleave My Events and the FAB
// so the bar reads Discover · Events · [+] · Profile with the FAB centered.
function BottomBar(props: TabListProps) {
  const kids = Children.toArray(props.children);
  return (
    <View style={styles.barWrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {kids[0]}
        <StaticItem icon="☰" label="Events" onPress={() => router.push('/my-events')} />
        <Fab />
        {kids[1]}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  barWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23,23,31,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 26,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    width: '100%',
    maxWidth: 460,
    gap: Spacing.two,
  },
  item: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    minWidth: 60,
  },
  icon: {
    fontSize: 20,
  },
  fabWrap: {
    marginTop: -30,
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
