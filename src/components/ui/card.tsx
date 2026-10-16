import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, motion, radius, useTheme, type ElevationLevel } from '@/theme';

import { PressableScale } from './pressable-scale';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  elevation?: ElevationLevel;
  tone?: 'surface' | 'sunken';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  onPress,
  padded = true,
  elevation = 'e1',
  tone = 'surface',
  accessibilityLabel,
  style,
}: Props) {
  const { colors, shadow, scheme } = useTheme();
  const cardStyle = [
    styles.base,
    {
      backgroundColor: tone === 'sunken' ? colors.surfaceSunken : colors.surface,
      borderColor: scheme === 'dark' || tone === 'sunken' ? colors.border : 'transparent',
      boxShadow: tone === 'surface' ? shadow(elevation) : undefined,
    },
    padded && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={motion.pressScale.card}
        accessibilityLabel={accessibilityLabel}
        style={cardStyle}>
        {children}
      </PressableScale>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  padded: { padding: layout.cardPadding },
});
