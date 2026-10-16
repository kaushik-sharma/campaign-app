import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { DRAFT_STEPS, draftStepLabels, draftStepShortLabels, type DraftStep } from '@/domain/draft';
import { duration, easing, fonts, space, spring, useTheme } from '@/theme';

const DOT = 26;

function Connector({ filled }: { filled: boolean }) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const fill = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    fill.set(withTiming(filled ? 1 : 0, { duration: duration.slow, easing: easing.standard }));
  }, [filled, fill]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -width.get() * (1 - fill.get()) }] }));
  return (
    <View
      onLayout={(e) => width.set(e.nativeEvent.layout.width)}
      style={[styles.connector, { backgroundColor: colors.border }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }, style]} />
    </View>
  );
}

function Dot({ index, state }: { index: number; state: 'done' | 'current' | 'todo' }) {
  const { colors } = useTheme();
  const active = useSharedValue(state === 'todo' ? 0 : 1);
  const scale = useSharedValue(1);
  useEffect(() => {
    active.set(withTiming(state === 'todo' ? 0 : 1, { duration: duration.base }));
    if (state === 'current') scale.set(withSpring(1.12, spring.snappy, () => scale.set(withSpring(1, spring.gentle))));
  }, [state, active, scale]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(active.get(), [0, 1], [colors.surface, state === 'done' ? colors.primarySoft : colors.primary]),
    borderColor: interpolateColor(active.get(), [0, 1], [colors.borderStrong, colors.primary]),
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={[styles.dot, style]}>
      {state === 'done' ? (
        <CheckIcon size={13} color={colors.primary} weight="bold" />
      ) : (
        <Text
          maxFontSizeMultiplier={1}
          style={[styles.number, { color: state === 'current' ? colors.onPrimary : colors.textMuted }]}>
          {index + 1}
        </Text>
      )}
    </Animated.View>
  );
}

type Props = {
  current: DraftStep;
  /** Steps the creator may jump to (earlier steps, or later ones already completed). */
  canJumpTo: (step: DraftStep) => boolean;
  onJump: (step: DraftStep) => void;
};

/** The persistent five-step indicator. Done steps show a check; the line fills as you advance. */
export function Stepper({ current, canJumpTo, onJump }: Props) {
  const currentIndex = DRAFT_STEPS.indexOf(current);
  return (
    <View style={styles.root} accessibilityRole="tablist">
      {DRAFT_STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo';
        const enabled = step !== current && canJumpTo(step);
        return (
          <View key={step} style={[styles.item, i > 0 && styles.flex]}>
            {i > 0 && <Connector filled={i <= currentIndex} />}
            <PressableScale
              onPress={() => onJump(step)}
              disabled={!enabled}
              haptic="selection"
              scaleTo={0.9}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityState={{ selected: state === 'current', disabled: !enabled }}
              accessibilityLabel={`Step ${i + 1} of ${DRAFT_STEPS.length}: ${draftStepLabels[step]}${state === 'done' ? ', done' : ''}`}
              style={styles.target}>
              <Dot index={i} state={state} />
              <Text
                variant="caption"
                color={state === 'todo' ? 'textMuted' : 'text'}
                maxFontSizeMultiplier={1.1}
                numberOfLines={1}
                style={styles.label}>
                {draftStepShortLabels[step]}
              </Text>
            </PressableScale>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start' },
  item: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
  connector: { flex: 1, height: 2, marginTop: DOT / 2 - 1, marginHorizontal: -10, borderRadius: 1, overflow: 'hidden' },
  target: { alignItems: 'center', gap: space.xs, width: 52 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  label: { textAlign: 'center' },
});
