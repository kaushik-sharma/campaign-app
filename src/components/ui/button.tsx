import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { radius, space, useTheme, type ColorTokens } from '@/theme';

import type { IconComponent } from './icons';
import { PressableScale } from './pressable-scale';
import { Text, type TextColor } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconComponent;
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const heights: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };

function variantColors(variant: ButtonVariant, colors: ColorTokens) {
  switch (variant) {
    case 'secondary':
      return { bg: colors.surface, border: colors.borderStrong, fg: 'text' as TextColor };
    case 'ghost':
      return { bg: 'transparent', border: 'transparent', fg: 'primary' as TextColor };
    case 'destructive':
      return { bg: colors.dangerSoft, border: 'transparent', fg: 'danger' as TextColor };
    default:
      return { bg: colors.primary, border: colors.primary, fg: 'onPrimary' as TextColor };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
  style,
}: Props) {
  const { colors } = useTheme();
  const c = variantColors(variant, colors);
  const inactive = disabled || loading;
  const fg = disabled ? 'textDisabled' : c.fg;
  const iconNode = Icon ? <Icon size={size === 'sm' ? 16 : 20} color={colors[fg]} weight="bold" /> : null;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={variant === 'primary' ? 'tap' : null}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        {
          height: heights[size],
          paddingHorizontal: size === 'sm' ? space.md : space.xl,
          backgroundColor: disabled && variant !== 'ghost' ? colors.surfaceSunken : c.bg,
          borderColor: disabled ? 'transparent' : c.border,
          borderRadius: size === 'sm' ? radius.sm : radius.md,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      <View style={[styles.content, loading && styles.hidden]}>
        {iconPosition === 'leading' && iconNode}
        <Text variant={size === 'sm' ? 'subhead' : 'bodyStrong'} color={fg} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        {iconPosition === 'trailing' && iconNode}
      </View>
      {loading && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
          <View style={styles.spinner}>
            <ActivityIndicator color={colors[c.fg]} />
          </View>
        </Animated.View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  hidden: { opacity: 0 },
  spinner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
