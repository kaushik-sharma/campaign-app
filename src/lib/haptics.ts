import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { usePreferences } from '@/stores/preferences';

/** Central haptics so intensity stays consistent and the user toggle is honoured everywhere. */
function enabled() {
  return Platform.OS !== 'web' && usePreferences.getState().haptics;
}

export const haptics = {
  /** Tab changes, chip/segment selection, preset amounts. */
  selection() {
    if (enabled()) void Haptics.selectionAsync();
  },
  /** Primary button presses. */
  tap() {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Sheet snaps, drag thresholds. */
  medium() {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  success() {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning() {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error() {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
