import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, space, useTheme } from '@/theme';

/**
 * One backing step: scrolling content with a pinned footer that rides above the keyboard
 * (tracked on the UI thread, so it moves in step with the keyboard on both platforms).
 */
export function StepLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();

  const rootStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.get(), insets.bottom),
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <ScrollView
        style={styles.root}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>{footer}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: layout.gutter, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.xxl },
  footer: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
