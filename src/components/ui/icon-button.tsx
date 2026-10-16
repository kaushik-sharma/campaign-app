import { useEffect, useRef } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { layout, radius, spring, useTheme } from '@/theme';

import type { IconComponent } from './icons';
import { PressableScale } from './pressable-scale';

type Props = {
  icon: IconComponent;
  /** Required: icon-only buttons must have a spoken label. */
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: 'plain' | 'tinted' | 'surface';
  size?: number;
  disabled?: boolean;
  /** Toggle buttons (follow, save): filled accent icon, and a pop when switched on. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  size = 40,
  disabled,
  active,
  style,
}: Props) {
  const { colors, shadow } = useTheme();
  const pop = useSharedValue(1);
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && wasActive.current === false) {
      pop.set(withSequence(withSpring(1.25, { ...spring.snappy, stiffness: 600 }), withSpring(1, spring.celebrate)));
    }
    wasActive.current = active;
  }, [active, pop]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const iconColor = disabled ? colors.textDisabled : active ? colors.primary : colors.text;
  const bg =
    variant === 'tinted' ? colors.surfaceSunken : variant === 'surface' ? colors.surface : 'transparent';
  // Keep the touch target at least 44pt even when the visual is smaller.
  const slop = Math.max(0, (layout.minTouch - size) / 2);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="selection"
      scaleTo={0.9}
      accessibilityLabel={accessibilityLabel}
      {...(active !== undefined && { accessibilityState: { selected: active, disabled: !!disabled } })}
      hitSlop={slop}
      style={[
        styles.base,
        { width: size, height: size, backgroundColor: bg },
        variant === 'surface' && { boxShadow: shadow('e2') },
        style,
      ]}>
      <Animated.View style={iconStyle}>
        <Icon size={Math.round(size * 0.5)} color={iconColor} weight={active ? 'fill' : 'regular'} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
});
