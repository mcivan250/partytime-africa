import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

// Overlapping initial-circles (DESIGN.md avatar stack). Colors are picked
// deterministically from the name so a person keeps the same color.
const COLORS = ['#F73558', '#FF6B35', '#FFB84D', '#3DDC97', '#2EC4B6', '#E9C46A', '#5BEA8E'];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

export function Avatars({ names, max = 6 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const overflow = Math.max(0, names.length - shown.length);
  return (
    <View style={styles.row}>
      {shown.map((name, i) => (
        <View
          key={`${name}-${i}`}
          style={[
            styles.avatar,
            { backgroundColor: colorFor(name), marginLeft: i === 0 ? 0 : -8, zIndex: max - i },
          ]}>
          <ThemedText type="smallBold" style={styles.initial}>
            {name.trim().charAt(0).toUpperCase() || '?'}
          </ThemedText>
        </View>
      ))}
      {overflow > 0 ? (
        <View style={[styles.avatar, styles.more]}>
          <ThemedText type="smallBold" style={styles.moreText}>
            +{overflow}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#19231B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#07130B',
  },
  more: {
    backgroundColor: '#33473A',
    marginLeft: -8,
  },
  moreText: {
    color: '#EFF6EE',
  },
});
