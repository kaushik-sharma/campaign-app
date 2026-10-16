import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { ClockIcon } from '@/components/ui/icons';
import { haptics } from '@/lib/haptics';
import { duration, easing, spring, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type PaymentVisualState = 'processing' | 'succeeded' | 'pending' | 'failed' | 'cancelled';

const SIZE = 96;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CHECK = 'M30 50 L43 62 L67 37';
const CHECK_LENGTH = 52;
const CROSS = 'M36 36 L60 60 M60 36 L36 60';
const CROSS_LENGTH = 68;
const DASH = 'M34 48 L62 48';
const DASH_LENGTH = 28;

const marks = {
  succeeded: { d: CHECK, length: CHECK_LENGTH },
  failed: { d: CROSS, length: CROSS_LENGTH },
  cancelled: { d: DASH, length: DASH_LENGTH },
} as const;

/**
 * One icon that morphs through the payment: a spinning arc while processing, which closes into a
 * full ring, fills, and draws a check on success (or a cross on failure). Fires the matching
 * haptic as the mark lands. With reduce motion the end state appears without the morph.
 */
export function PaymentStatusIcon({ state }: { state: PaymentVisualState }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const arc = useSharedValue(0.28); // visible share of the ring
  const fill = useSharedValue(0);
  const mark = useSharedValue(0);
  const shake = useSharedValue(0);
  const scale = useSharedValue(1);

  const tone =
    state === 'succeeded'
      ? colors.success
      : state === 'failed'
        ? colors.danger
        : state === 'pending'
          ? colors.warning
          : state === 'cancelled'
            ? colors.textMuted
            : colors.primary;

  useEffect(() => {
    const t = (ms: number) => (reduced ? 0 : ms);
    if (state === 'processing') {
      arc.set(0.28);
      fill.set(0);
      mark.set(0);
      spin.set(0);
      spin.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1));
      return;
    }

    cancelAnimation(spin);
    mark.set(0); // redraw the mark, e.g. when a pending payment is confirmed
    arc.set(withTiming(1, { duration: t(duration.slow), easing: easing.standard }));

    if (state !== 'pending') {
      fill.set(withDelay(t(duration.slow - 60), withSpring(1, spring.snappy)));
      const landed = state === 'succeeded' ? haptics.success : state === 'failed' ? haptics.error : haptics.tap;
      mark.set(
        withDelay(
          t(duration.slow + 120),
          withTiming(1, { duration: t(duration.slow), easing: easing.enter }, (finished) => {
            if (finished) scheduleOnRN(landed);
          }),
        ),
      );
      if (state === 'succeeded') {
        scale.set(withDelay(t(duration.slow + 120), withSequence(withSpring(1.08, spring.snappy), withSpring(1, spring.celebrate))));
      } else if (state === 'failed' && !reduced) {
        shake.set(
          withDelay(
            duration.slow + 200,
            withSequence(
              withTiming(-6, { duration: 60 }),
              withTiming(6, { duration: 60 }),
              withTiming(-4, { duration: 60 }),
              withTiming(0, { duration: 60 }),
            ),
          ),
        );
      }
    } else {
      fill.set(withDelay(t(duration.base), withSpring(1, spring.snappy)));
      mark.set(withDelay(t(duration.base), withSpring(1, spring.snappy)));
      haptics.warning();
    }
  }, [state, reduced, spin, arc, fill, mark, shake, scale]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360 - 90}deg` }] }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - arc.get()) }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.get(), transform: [{ scale: 0.6 + 0.4 * fill.get() }] }));
  const markLength = state === 'processing' || state === 'pending' ? 0 : marks[state].length;
  const markProps = useAnimatedProps(() => ({ strokeDashoffset: markLength * (1 - mark.get()) }));
  const glyphStyle = useAnimatedStyle(() => ({ opacity: mark.get(), transform: [{ scale: 0.5 + 0.5 * mark.get() }] }));
  const rootStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }, { scale: scale.get() }] }));

  const label = {
    processing: 'Processing payment',
    succeeded: 'Payment succeeded',
    pending: 'Payment pending',
    failed: 'Payment failed',
    cancelled: 'Payment cancelled',
  }[state];

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.root, rootStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: tone }, fillStyle]} />
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={tone}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            fill="none"
            animatedProps={ringProps}
          />
        </Svg>
      </Animated.View>

      {state !== 'processing' && state !== 'pending' && (
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <AnimatedPath
            d={marks[state].d}
            stroke={colors.onPrimary}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={marks[state].length}
            animatedProps={markProps}
          />
        </Svg>
      )}

      {state === 'pending' && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, glyphStyle]}>
          <ClockIcon size={44} color={colors.onPrimary} weight="bold" />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { width: SIZE, height: SIZE },
  fill: { borderRadius: SIZE / 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
