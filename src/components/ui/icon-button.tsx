import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { layout, radius, useTheme } from '@/theme';

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
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  size = 40,
  disabled,
  style,
}: Props) {
  const { colors, shadow } = useTheme();
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
      hitSlop={slop}
      style={[
        styles.base,
        { width: size, height: size, backgroundColor: bg },
        variant === 'surface' && { boxShadow: shadow('e2') },
        style,
      ]}>
      <Icon size={Math.round(size * 0.5)} color={disabled ? colors.textDisabled : colors.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
});
