import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, space } from '@/theme';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Props = {
  title?: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
  /** Remove side gutters, e.g. for edge-to-edge carousels. */
  bleed?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Section({ title, description, action, children, bleed, style }: Props) {
  return (
    <View style={[styles.section, style]}>
      {(title || action) && (
        <View style={styles.header}>
          <View style={styles.titles}>
            {title && (
              <Text variant="title2" accessibilityRole="header">
                {title}
              </Text>
            )}
            {description && (
              <Text variant="subhead" color="textMuted">
                {description}
              </Text>
            )}
          </View>
          {action && (
            <PressableScale onPress={action.onPress} scaleTo={0.94} hitSlop={12} accessibilityLabel={action.label}>
              <Text variant="subhead" color="primary">
                {action.label}
              </Text>
            </PressableScale>
          )}
        </View>
      )}
      <View style={!bleed && styles.gutter}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, marginBottom: layout.sectionGap },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: layout.gutter,
  },
  titles: { flex: 1, gap: 2 },
  gutter: { paddingHorizontal: layout.gutter },
});
