import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing, layout, motion, space, useTheme } from '@/theme';

import { CaretDownIcon, type IconComponent } from './icons';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconComponent;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** Expandable section for secondary detail. Height and chevron animate on the UI thread. */
export function Accordion({ title, subtitle, icon: Icon, children, defaultOpen = false }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const contentHeight = useSharedValue(0);
  const progress = useDerivedValue(() =>
    withTiming(open ? 1 : 0, { duration: duration.slow, easing: easing.standard }),
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: contentHeight.get() * progress.get(),
    opacity: progress.get(),
  }));
  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 180}deg` }],
  }));

  return (
    <View>
      <PressableScale
        onPress={() => setOpen((o) => !o)}
        haptic="selection"
        scaleTo={motion.pressScale.row}
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        accessibilityHint={open ? 'Collapses this section' : 'Expands this section'}
        style={styles.header}>
        {Icon && <Icon size={20} color={colors.text} />}
        <View style={styles.titles}>
          <Text variant="bodyStrong">{title}</Text>
          {subtitle && (
            <Text variant="footnote" color="textMuted">
              {subtitle}
            </Text>
          )}
        </View>
        <Animated.View style={caretStyle}>
          <CaretDownIcon size={18} color={colors.textMuted} />
        </Animated.View>
      </PressableScale>
      <Animated.View style={[styles.body, bodyStyle]} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>
        <View
          style={styles.measure}
          onLayout={(e) => contentHeight.set(e.nativeEvent.layout.height)}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: layout.minTouch + 8,
    paddingVertical: space.md,
  },
  titles: { flex: 1, gap: 2 },
  body: { overflow: 'hidden' },
  measure: { position: 'absolute', left: 0, right: 0, paddingBottom: space.lg },
});
