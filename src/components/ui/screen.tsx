import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { RefreshControl, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, space, useTheme } from '@/theme';

import { IconButton } from './icon-button';
import { ArrowLeftIcon } from './icons';
import { Text } from './text';

const COMPACT_HEADER = 48;
const LARGE_TITLE = 52;

type Props = {
  title: string;
  /** Small text above the large title. */
  eyebrow?: string;
  children: ReactNode;
  /** Shows a back button in the compact header. */
  back?: boolean;
  /**
   * Brand header for top-level screens whose content leads with its own headline (Home):
   * the wordmark sits in the header permanently and there is no large title.
   */
  brand?: boolean;
  /** Right side of the compact header. */
  headerRight?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard scrolling screen: a large title that hands over to a compact header as you scroll.
 * The cross-fade is driven by the scroll position on the UI thread.
 */
export function Screen({
  title,
  eyebrow,
  children,
  back,
  brand = false,
  headerRight,
  onRefresh,
  refreshing = false,
  contentStyle,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const bgRange = brand ? [0, 16] : [LARGE_TITLE - 24, LARGE_TITLE];
  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), bgRange, [0, 1], 'clamp'),
  }));
  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [LARGE_TITLE - 12, LARGE_TITLE + 8], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(scrollY.get(), [LARGE_TITLE - 12, LARGE_TITLE + 8], [6, 0], 'clamp') },
    ],
  }));
  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, LARGE_TITLE], [1, 0], 'clamp'),
    // Rubber-band: the title grows slightly when pulled down.
    transform: [{ scale: interpolate(scrollY.get(), [-100, 0], [1.08, 1], 'clamp') }],
  }));

  const headerHeight = insets.top + COMPACT_HEADER;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          { paddingTop: headerHeight, paddingBottom: space['4xl'] },
          contentStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textMuted}
              progressViewOffset={headerHeight}
            />
          ) : undefined
        }>
        {!brand && (
          <Animated.View style={[styles.largeTitle, largeTitleStyle]}>
            {eyebrow && (
              <Text variant="overline" color="textMuted">
                {eyebrow}
              </Text>
            )}
            <Text variant="display" accessibilityRole="header">
              {title}
            </Text>
          </Animated.View>
        )}
        {children}
      </Animated.ScrollView>

      <View pointerEvents="box-none" style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.bg, borderBottomColor: colors.border },
            styles.headerBg,
            headerBgStyle,
          ]}
        />
        {brand ? (
          <View style={styles.brand}>
            <Text variant="title3" accessibilityRole="header">
              {title}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerSide}>
              {back && (
                <IconButton icon={ArrowLeftIcon} accessibilityLabel="Back" onPress={() => router.back()} />
              )}
            </View>
            <Animated.View style={[styles.headerTitle, compactTitleStyle]} pointerEvents="none">
              <Text variant="title3" numberOfLines={1} importantForAccessibility="no">
                {title}
              </Text>
            </Animated.View>
          </>
        )}
        <View style={[styles.headerSide, styles.headerRight]}>{headerRight}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  largeTitle: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.xs,
    paddingBottom: space.xl,
    transformOrigin: 'left',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
  },
  headerBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide: { width: 88, flexDirection: 'row', alignItems: 'center' },
  headerRight: { justifyContent: 'flex-end' },
  headerTitle: { flex: 1, alignItems: 'center' },
  brand: { flex: 1, paddingHorizontal: layout.gutter - space.sm },
});
