import { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import type { Cents } from '@/domain/types';
import { formatMoney } from '@/lib/format';
import { duration, easing, fonts, radius, space, spring, useTheme } from '@/theme';

const pop = () => withSequence(withSpring(1.08, { ...spring.snappy, stiffness: 600 }), withSpring(1, spring.celebrate));

function PresetTile({ cents, selected, onPress }: { cents: Cents; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.set(withTiming(selected ? 1 : 0, { duration: duration.fast, easing: easing.standard }));
    if (selected) scale.set(pop());
  }, [selected, progress, scale]);

  const tileStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.surface, colors.surfaceInverse]),
    borderColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.surfaceInverse]),
    transform: [{ scale: scale.get() }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [colors.text, colors.textInverse]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.94}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={formatMoney(cents)}
      style={styles.tileWrap}>
      <Animated.View style={[styles.tile, tileStyle]}>
        <Animated.Text maxFontSizeMultiplier={1.3} style={[styles.tileLabel, labelStyle]}>
          {formatMoney(cents)}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

type Props = {
  amountCents: Cents;
  onChange: (cents: Cents) => void;
  error?: string | null;
};

/**
 * Large editable amount with preset tiles. Presets fill the amount and spring; typing a custom
 * amount deselects them. Whole dollars only.
 */
export function AmountPicker({ amountCents, onChange, error }: Props) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const scale = useSharedValue(1);
  const dollars = amountCents > 0 ? String(Math.round(amountCents / 100)) : '';
  const { minContributionCents: min, maxContributionCents: max, presetAmountsCents } = demo.funding;

  const amountStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const choosePreset = (cents: Cents) => {
    inputRef.current?.blur();
    onChange(cents);
    scale.set(pop());
  };

  return (
    <View style={styles.root}>
      <PressableScale
        onPress={() => inputRef.current?.focus()}
        scaleTo={0.98}
        accessibilityRole="none"
        accessible={false}
        style={styles.amountTap}>
        <Animated.View style={[styles.amountRow, amountStyle]}>
          <Text style={[styles.currency, { color: dollars ? colors.text : colors.textDisabled }]}>$</Text>
          <TextInput
            ref={inputRef}
            value={dollars}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').replace(/^0+/, '');
              onChange(digits ? Number(digits) * 100 : 0);
            }}
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={String(max / 100).length}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            accessibilityLabel="Contribution amount in dollars"
            accessibilityHint={`Whole dollars, ${formatMoney(min)} to ${formatMoney(max)}`}
            maxFontSizeMultiplier={1.2}
            style={[styles.amountInput, { color: colors.text }]}
          />
        </Animated.View>
      </PressableScale>

      <Text
        variant="footnote"
        color={error ? 'danger' : 'textMuted'}
        align="center"
        accessibilityLiveRegion={error ? 'polite' : 'none'}>
        {error ?? `Whole dollars, ${formatMoney(min)} to ${formatMoney(max)}. Tap the amount to type your own.`}
      </Text>

      <View style={styles.presets} accessibilityRole="radiogroup" accessibilityLabel="Suggested amounts">
        {presetAmountsCents.map((cents) => (
          <PresetTile key={cents} cents={cents} selected={amountCents === cents} onPress={() => choosePreset(cents)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.lg },
  amountTap: { alignSelf: 'center', paddingVertical: space.xs },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  currency: { fontFamily: fonts.semibold, fontSize: 36, lineHeight: 64, marginRight: 2 },
  amountInput: {
    fontFamily: fonts.bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.2,
    minWidth: 40,
    padding: 0,
    margin: 0,
    fontVariant: ['tabular-nums'],
  },
  presets: { flexDirection: 'row', gap: space.sm },
  tileWrap: { flex: 1 },
  tile: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
});
