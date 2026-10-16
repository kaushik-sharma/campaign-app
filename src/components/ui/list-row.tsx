import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout, motion, radius, space, useTheme } from '@/theme';

import { CaretRightIcon, type IconComponent } from './icons';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconComponent;
  /** Text value shown on the right, e.g. the current setting. */
  value?: string;
  /** Custom trailing element (switch, badge). Replaces the chevron. */
  trailing?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  destructive?: boolean;
  accessibilityHint?: string;
};

export function ListRow({
  title,
  subtitle,
  icon: Icon,
  value,
  trailing,
  onPress,
  onLongPress,
  destructive,
  accessibilityHint,
}: Props) {
  const { colors } = useTheme();
  const content = (
    <>
      {Icon && (
        <View style={[styles.icon, { backgroundColor: destructive ? colors.dangerSoft : colors.surfaceSunken }]}>
          <Icon size={18} color={destructive ? colors.danger : colors.text} />
        </View>
      )}
      <View style={styles.text}>
        <Text variant="body" color={destructive ? 'danger' : 'text'} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="subhead" color="textMuted" numberOfLines={1}>
          {value}
        </Text>
      )}
      {trailing ?? (onPress && <CaretRightIcon size={16} color={colors.textMuted} />)}
    </>
  );

  if (!onPress && !onLongPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={motion.pressScale.row}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      style={styles.row}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: layout.minTouch + 12,
    paddingVertical: space.sm,
    paddingHorizontal: layout.cardPadding,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});
