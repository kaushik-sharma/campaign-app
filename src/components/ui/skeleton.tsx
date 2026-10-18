import { LinearGradient } from 'expo-linear-gradient';
import { createContext, use, useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/lib/reduced-motion';
import { radius as radii, useTheme } from '@/theme';

const ShimmerClock = createContext<SharedValue<number> | null>(null);

/**
 * Wrap a loading layout in a SkeletonGroup so every placeholder shimmers in sync from one clock.
 * With reduce motion on, placeholders stay static.
 */
export function SkeletonGroup({
  children,
  style,
  label = 'Loading',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    clock.set(withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, false));
    return () => cancelAnimation(clock);
  }, [reduced, clock]);

  return (
    <ShimmerClock value={reduced ? null : clock}>
      <View
        style={style}
        accessible
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}>
        {children}
      </View>
    </ShimmerClock>
  );
}

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 14, radius = radii.xs, style }: SkeletonProps) {
  const { colors } = useTheme();
  const clock = use(ShimmerClock);
  const w = useSharedValue(0);

  const bandStyle = useAnimatedStyle(() => {
    const t = clock ? clock.get() : 0;
    return { transform: [{ translateX: interpolate(t, [0, 1], [-w.get(), w.get()]) }] };
  });

  return (
    <View
      onLayout={(e) => w.set(e.nativeEvent.layout.width)}
      style={[styles.base, { width, height, borderRadius: radius, backgroundColor: colors.shimmerBase }, style]}>
      {clock && (
        <Animated.View style={[StyleSheet.absoluteFill, bandStyle]}>
          <LinearGradient
            colors={['transparent', colors.shimmerHighlight, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
