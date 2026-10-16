import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { duration, easing, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A small circular progress indicator that fills from empty. Goal reached turns it green. */
export function ProgressRing({ value, size = 36, stroke = 4, delay = 0 }: { value: number; size?: number; stroke?: number; delay?: number }) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withDelay(delay, withTiming(clamped, { duration: duration.counter, easing: easing.enter })));
  }, [clamped, delay, progress]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get()) }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceSunken} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={value >= 1 ? colors.success : colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
