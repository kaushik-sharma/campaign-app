import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { MicrophoneIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/theme';

const MIC = 88;
const BARS = 28;

function Ring({ active, delay }: { active: boolean; delay: number }) {
  const { colors } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(active ? withDelay(delay, withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1)) : withTiming(0));
  }, [active, delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: active ? 0.35 * (1 - t.get()) : 0, transform: [{ scale: 1 + t.get() * 0.9 }] }));
  return <Animated.View pointerEvents="none" style={[styles.ring, { backgroundColor: colors.primary }, style]} />;
}

/** The big mic button. Rings pulse outward while "listening". */
export function MicButton({ listening, onPress, disabled }: { listening: boolean; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return (
    <View style={styles.micWrap}>
      {!reduced && <Ring active={listening} delay={0} />}
      {!reduced && <Ring active={listening} delay={800} />}
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        haptic="medium"
        scaleTo={0.92}
        accessibilityLabel={listening ? 'Stop listening' : 'Start answering'}
        style={[styles.mic, { backgroundColor: listening ? colors.danger : colors.primary }]}>
        <MicrophoneIcon size={36} color={colors.onPrimary} weight="fill" />
      </PressableScale>
    </View>
  );
}

function Bar({ active, index }: { active: boolean; index: number }) {
  const { colors } = useTheme();
  const [peak] = useState(() => 0.35 + Math.random() * 0.65);
  const h = useSharedValue(0.12);
  useEffect(() => {
    if (!active) {
      h.set(withTiming(0.12, { duration: 300 }));
      return;
    }
    const speed = 220 + (index % 5) * 60;
    h.set(withRepeat(withSequence(withTiming(peak, { duration: speed }), withTiming(0.15 + Math.random() * 0.2, { duration: speed })), -1, true));
  }, [active, index, peak, h]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: h.get() }] }));
  return <Animated.View style={[styles.bar, { backgroundColor: active ? colors.primary : colors.borderStrong }, style]} />;
}

/** A decorative level meter that moves while listening. Hidden from screen readers. */
export function Waveform({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  return (
    <View style={styles.wave} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: BARS }, (_, i) => (
        <Bar key={i} index={i} active={active && !reduced} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  micWrap: { width: MIC * 2, height: MIC * 2, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: MIC, height: MIC, borderRadius: MIC / 2 },
  mic: { width: MIC, height: MIC, borderRadius: MIC / 2, alignItems: 'center', justifyContent: 'center' },
  wave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, height: 44 },
  bar: { width: 4, height: 44, borderRadius: 2 },
});
