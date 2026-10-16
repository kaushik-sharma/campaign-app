import { StyleSheet, View } from 'react-native';

import type { StatusTone } from '@/domain/lifecycle';
import { radius, space, useTheme, type ColorTokens } from '@/theme';

import type { IconComponent } from './icons';
import { Text, type TextColor } from './text';

export type BadgeTone = StatusTone | 'primary';

export function toneColors(tone: BadgeTone, colors: ColorTokens): { bg: string; fg: TextColor } {
  switch (tone) {
    case 'info':
    case 'primary':
      return { bg: colors.primarySoft, fg: 'primary' };
    case 'success':
      return { bg: colors.successSoft, fg: 'success' };
    case 'warning':
      return { bg: colors.warningSoft, fg: 'warning' };
    case 'danger':
      return { bg: colors.dangerSoft, fg: 'danger' };
    default:
      return { bg: colors.surfaceSunken, fg: 'textMuted' };
  }
}

type Props = {
  label: string;
  tone?: BadgeTone;
  icon?: IconComponent;
  /** Leading status dot instead of an icon. */
  dot?: boolean;
};

export function Badge({ label, tone = 'neutral', icon: Icon, dot }: Props) {
  const { colors } = useTheme();
  const c = toneColors(tone, colors);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: colors[c.fg] }]} />}
      {Icon && <Icon size={12} color={colors[c.fg]} weight="bold" />}
      <Text variant="caption" color={c.fg} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
