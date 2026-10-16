import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import {
  BellIcon,
  CompassIcon,
  HouseIcon,
  PlusIcon,
  UserCircleIcon,
  type IconComponent,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { useActivity } from '@/features/activity/queries';
import { haptics } from '@/lib/haptics';
import { layout, radius, spring, useTheme } from '@/theme';

const TABS: Record<string, { label: string; icon: IconComponent }> = {
  index: { label: 'Home', icon: HouseIcon },
  explore: { label: 'Explore', icon: CompassIcon },
  create: { label: 'Create', icon: PlusIcon },
  activity: { label: 'Activity', icon: BellIcon },
  profile: { label: 'Profile', icon: UserCircleIcon },
};

const INDICATOR_WIDTH = 56;

/**
 * Custom tab bar: a soft pill slides behind the active icon (spring on the UI thread), the icon
 * switches to its filled weight, and each change fires a selection haptic.
 */
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const unread = useActivity().data?.some((e) => !e.read) ?? false;
  const itemWidth = useSharedValue(0);
  const position = useSharedValue(state.index);

  useEffect(() => {
    position.set(withSpring(state.index, spring.snappy));
  }, [state.index, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.get() * itemWidth.get() + (itemWidth.get() - INDICATOR_WIDTH) / 2 },
    ],
    opacity: itemWidth.get() > 0 ? 1 : 0,
  }));

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom,
          height: layout.tabBarHeight + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}>
      <View style={styles.items} onLayout={(e) => itemWidth.set(e.nativeEvent.layout.width / state.routes.length)}>
        <Animated.View style={[styles.indicator, { backgroundColor: colors.primarySoft }, indicatorStyle]} />
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const Icon = tab.icon;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptics.selection();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={route.name === 'activity' && unread ? `${tab.label}, new items` : tab.label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              scaleTo={0.9}
              style={styles.item}>
              <View style={styles.iconSlot}>
                <Icon size={24} color={focused ? colors.primary : colors.textMuted} weight={focused ? 'fill' : 'regular'} />
                {route.name === 'activity' && unread && (
                  <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.surface }]} />
                )}
              </View>
              <Text
                variant="caption"
                color={focused ? 'text' : 'textMuted'}
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}>
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  items: { flex: 1, flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconSlot: { height: 32, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 3, right: -3, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  indicator: {
    position: 'absolute',
    top: (layout.tabBarHeight - 32 - 16 - 2) / 2,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 32,
    borderRadius: radius.pill,
  },
});
