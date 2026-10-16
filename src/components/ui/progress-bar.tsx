import { useEffect } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, radius, useTheme } from '@/theme';

type Props = {
  /** Fraction funded; values above 1 render as full. */
  value: number;
  height?: number;
  tone?: 'primary' | 'success';
  /** Grow from zero on first render. Later value changes animate from the previous value. */
  animateOnMount?: boolean;
  delay?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({
  value,
  height = 6,
  tone = 'primary',
  animateOnMount = true,
  delay = 0,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  const width = useSharedValue(0);
  const progress = useSharedValue(animateOnMount ? 0 : clamped);

  useEffect(() => {
    progress.set(
      withDelay(delay, withTiming(clamped, { duration: duration.counter, easing: easing.enter })),
    );
  }, [clamped, delay, progress]);

  // Translating a full-width fill keeps its rounded end intact (scaleX would squash it).
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width.get() * (1 - progress.get()) }],
  }));

  const fill = tone === 'success' || value >= 1 ? colors.success : colors.primary;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      onLayout={(e: LayoutChangeEvent) => width.set(e.nativeEvent.layout.width)}
      style={[styles.track, { height, backgroundColor: colors.surfaceSunken }]}>
      <Animated.View style={[styles.fill, { backgroundColor: fill }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, borderRadius: radius.pill },
});
