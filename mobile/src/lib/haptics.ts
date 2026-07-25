import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Tiny dopamine hits on key taps. No-op on web; never throws.
const native = Platform.OS !== 'web';

export function tapLight() {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function tapMedium() {
  if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
export function tapSuccess() {
  if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
