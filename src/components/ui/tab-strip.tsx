import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { radius, space, spring, useTheme } from '@/theme';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

export type Tab<T extends string> = { value: T; label: string; count?: number };

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/**
 * Scrollable text tabs with counts. The underline springs between tabs on the UI thread and
 * resizes to each label.
 */
export function TabStrip<T extends string>({ tabs, value, onChange, accessibilityLabel }: Props<T>) {
  const { colors } = useTheme();
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const current = layouts[value];

  useEffect(() => {
    if (!current) return;
    x.set(withSpring(current.x, spring.snappy));
    width.set(withSpring(current.width, spring.snappy));
  }, [current, x, width]);

  const underline = useAnimatedStyle(() => ({ width: width.get(), transform: [{ translateX: x.get() }], opacity: width.get() > 0 ? 1 : 0 }));

  return (
    <View style={[styles.root, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
        {tabs.map((tab) => {
          const selected = tab.value === value;
          return (
            <PressableScale
              key={tab.value}
              onPress={() => onChange(tab.value)}
              haptic="selection"
              scaleTo={0.95}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.count !== undefined ? `${tab.label}, ${tab.count}` : tab.label}
              onLayout={(e) => {
                const { x: lx, width: lw } = e.nativeEvent.layout;
                setLayouts((l) => (l[tab.value]?.x === lx && l[tab.value]?.width === lw ? l : { ...l, [tab.value]: { x: lx, width: lw } }));
              }}
              style={styles.tab}>
              <Text variant="subhead" color={selected ? 'text' : 'textMuted'} maxFontSizeMultiplier={1.3}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View style={[styles.count, { backgroundColor: selected ? colors.primary : colors.surfaceSunken }]}>
                  <Text variant="caption" color={selected ? 'onPrimary' : 'textMuted'} tabular maxFontSizeMultiplier={1.2}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </PressableScale>
          );
        })}
        <Animated.View style={[styles.underline, { backgroundColor: colors.primary }, underline]} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderBottomWidth: StyleSheet.hairlineWidth },
  content: { paddingHorizontal: space.md },
  tab: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: space.md },
  count: { minWidth: 20, height: 18, borderRadius: radius.pill, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  underline: { position: 'absolute', left: 0, bottom: 0, height: 2.5, borderRadius: 2 },
});
