import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, radius, space, useTheme } from '@/theme';

import { CheckIcon, type IconComponent } from './icons';
import { PressableScale } from './pressable-scale';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconComponent;
  /** Show a check mark when selected (multi-select filters). */
  showCheck?: boolean;
  count?: number;
};

/** Selectable pill used for categories and filters. Selection colour cross-fades on the UI thread. */
export function Chip({ label, selected = false, onPress, icon: Icon, showCheck, count }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(selected ? 1 : 0, { duration: duration.fast, easing: easing.standard }));
  }, [selected, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.surface, colors.surfaceInverse]),
    borderColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.surfaceInverse]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [colors.text, colors.textInverse]),
  }));

  const fg = selected ? colors.textInverse : colors.text;
  const text = count !== undefined ? `${label} · ${count}` : label;

  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.95}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={text}
      hitSlop={{ top: 4, bottom: 4 }}>
      <Animated.View style={[styles.chip, animatedStyle]}>
        {showCheck && selected ? (
          <CheckIcon size={14} color={fg} weight="bold" />
        ) : Icon ? (
          <Icon size={16} color={fg} />
        ) : null}
        <Animated.Text maxFontSizeMultiplier={1.3} style={[styles.label, labelStyle]} numberOfLines={1}>
          {text}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 36,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 18 },
});
