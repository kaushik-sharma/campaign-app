import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { spring, useTheme } from '@/theme';

const THUMB = 28;
const MIN_GAP = 5;

type Props = {
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
  /** Spoken value, e.g. "18 to 65 plus". */
  format: (age: number) => string;
};

/** A two-thumb range slider. Dragging runs on the UI thread; React only hears whole-number changes. */
export function AgeRangeSlider({ value, min, max, onChange, format }: Props) {
  const { colors } = useTheme();
  const span = max - min;
  const width = useSharedValue(0);
  const lo = useSharedValue((value[0] - min) / span);
  const hi = useSharedValue((value[1] - min) / span);
  const dragging = useSharedValue(0);
  const startLo = useSharedValue(0);
  const startHi = useSharedValue(0);
  const gap = MIN_GAP / span;

  // Follow outside changes (e.g. an AI-filled draft) when not dragging.
  useEffect(() => {
    if (dragging.get()) return;
    lo.set(withSpring((value[0] - min) / span, spring.snappy));
    hi.set(withSpring((value[1] - min) / span, spring.snappy));
  }, [value, min, span, lo, hi, dragging]);

  const emit = (a: number, b: number) => {
    haptics.selection();
    onChange([a, b]);
  };

  const makePan = (thumb: SharedValue<number>, start: SharedValue<number>, isLow: boolean) =>
    Gesture.Pan()
      .hitSlop({ horizontal: 12, vertical: 16 })
      .onBegin(() => {
        start.set(thumb.get());
        dragging.set(1);
      })
      .onUpdate((e) => {
        const w = width.get() - THUMB;
        if (w <= 0) return;
        const raw = start.get() + e.translationX / w;
        const next = isLow ? Math.min(Math.max(raw, 0), hi.get() - gap) : Math.max(Math.min(raw, 1), lo.get() + gap);
        const before = Math.round(thumb.get() * span);
        thumb.set(next);
        const after = Math.round(next * span);
        if (after !== before) {
          scheduleOnRN(emit, Math.round(lo.get() * span) + min, Math.round(hi.get() * span) + min);
        }
      })
      .onFinalize(() => {
        thumb.set(withSpring(Math.round(thumb.get() * span) / span, spring.snappy));
        dragging.set(0);
      });

  const lowPan = makePan(lo, startLo, true);
  const highPan = makePan(hi, startHi, false);

  const lowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lo.get() * (width.get() - THUMB) }] }));
  const highStyle = useAnimatedStyle(() => ({ transform: [{ translateX: hi.get() * (width.get() - THUMB) }] }));
  const fillStyle = useAnimatedStyle(() => {
    const w = width.get() - THUMB;
    return { left: lo.get() * w + THUMB / 2, width: (hi.get() - lo.get()) * w };
  });

  const step = (index: 0 | 1, delta: number) => {
    const next: [number, number] = [...value];
    next[index] = Math.max(min, Math.min(max, next[index] + delta));
    if (next[1] - next[0] < MIN_GAP) return;
    onChange(next);
  };

  const thumbProps = (index: 0 | 1, label: string) => ({
    accessible: true,
    accessibilityRole: 'adjustable' as const,
    accessibilityLabel: label,
    accessibilityValue: { text: format(value[index]) },
    accessibilityActions: [{ name: 'increment' as const }, { name: 'decrement' as const }],
    onAccessibilityAction: (e: { nativeEvent: { actionName: string } }) => step(index, e.nativeEvent.actionName === 'increment' ? 1 : -1),
  });

  return (
    <View style={styles.root} onLayout={(e) => width.set(e.nativeEvent.layout.width)}>
      <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]} />
      <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]} />
      <GestureDetector gesture={lowPan}>
        <Animated.View {...thumbProps(0, 'Minimum age')} style={[styles.thumb, { backgroundColor: colors.surface, borderColor: colors.primary }, lowStyle]} />
      </GestureDetector>
      <GestureDetector gesture={highPan}>
        <Animated.View {...thumbProps(1, 'Maximum age')} style={[styles.thumb, { backgroundColor: colors.surface, borderColor: colors.primary }, highStyle]} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: THUMB + 8, justifyContent: 'center' },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: 4, borderRadius: 2 },
  fill: { position: 'absolute', height: 4, borderRadius: 2 },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2,
    boxShadow: '0px 2px 6px rgba(16, 18, 22, 0.18)',
  },
});
