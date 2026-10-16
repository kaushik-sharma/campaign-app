import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { duration, easing, layout, space, spring, useTheme } from '@/theme';

import { IconButton } from './icon-button';
import { XIcon } from './icons';
import { Text } from './text';

/** Gap between the floating panel and the screen edges. */
const INSET = 8;
const PANEL_RADIUS = 32;
const MAX_HEIGHT_FRACTION = 0.9;
/** Drag further than this share of the panel height (or flick) to dismiss. */
const DISMISS_FRACTION = 0.3;
const DISMISS_VELOCITY = 900;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Any content. Rendered inside the panel below the optional title row. */
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Pinned below the content, e.g. a primary action. */
  footer?: ReactNode;
  /** For long content: the panel scrolls instead of growing, and only the handle drags. */
  scrollable?: boolean;
};

/**
 * The app's bottom sheet: one implementation, identical on iOS and Android.
 *
 * A floating panel inset from the screen edges (like iOS 26 sheets), sized to its content up to
 * 90% of the screen. It springs up on the UI thread over a fading backdrop and closes by drag,
 * backdrop tap, the close button or Android Back.
 *
 * @example
 * <Sheet open={open} onClose={() => setOpen(false)} title="Filters">
 *   <FilterForm />
 * </Sheet>
 */
export function Sheet({ open, onClose, children, title, subtitle, footer, scrollable = false }: Props) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  // Mount immediately on open (state adjusted during render); unmount after the exit animation.
  if (open && !mounted) setMounted(true);

  const progress = useSharedValue(0);
  const drag = useSharedValue(0);
  const panelHeight = useSharedValue(0);

  useEffect(() => {
    if (open) {
      drag.set(0);
      progress.set(withSpring(1, spring.sheet));
      haptics.selection();
    } else {
      progress.set(
        withTiming(0, { duration: duration.base, easing: easing.exit }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [open, progress, drag]);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onChange((e) => {
      // Resist upward drags; follow downward ones.
      const next = drag.get() + e.changeY;
      drag.set(next < 0 ? next * 0.2 : next);
    })
    .onEnd((e) => {
      if (drag.get() > panelHeight.get() * DISMISS_FRACTION || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        drag.set(withSpring(0, spring.snappy));
      }
    });

  // The panel floats above the home indicator on iOS and above the navigation bar on Android.
  const bottomGap = Platform.OS === 'ios' ? INSET : insets.bottom + INSET;
  const maxHeight = (windowHeight - insets.top) * MAX_HEIGHT_FRACTION;

  const panelStyle = useAnimatedStyle(() => {
    // Before the first layout the height is unknown, so start a full screen below.
    const distance = (panelHeight.get() || windowHeight) + bottomGap;
    return {
      transform: [{ translateY: interpolate(progress.get(), [0, 1], [distance, 0]) + drag.get() }],
    };
  });
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

  const handle = (
    <View style={styles.handleArea}>
      <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
    </View>
  );

  const content = (
    <>
      {title && (
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text variant="title2" accessibilityRole="header">
              {title}
            </Text>
            {subtitle && (
              <Text variant="subhead" color="textMuted">
                {subtitle}
              </Text>
            )}
          </View>
          <IconButton icon={XIcon} accessibilityLabel="Close" variant="tinted" size={32} onPress={onClose} />
        </View>
      )}
      {children}
      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );

  const panel = (
    <Animated.View
      accessibilityViewIsModal
      onLayout={(e) => panelHeight.set(e.nativeEvent.layout.height)}
      style={[
        styles.panel,
        {
          bottom: bottomGap,
          maxHeight,
          backgroundColor: colors.surface,
          borderColor: scheme === 'dark' ? colors.border : 'transparent',
          boxShadow: scheme === 'dark' ? undefined : '0px 12px 40px rgba(16, 18, 22, 0.18)',
        },
        panelStyle,
      ]}>
      {scrollable ? <GestureDetector gesture={pan}>{handle}</GestureDetector> : handle}
      {scrollable ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          {content}
        </ScrollView>
      ) : (
        <View style={styles.body}>{content}</View>
      )}
    </Animated.View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        {/* Short content drags from anywhere on the panel; scrollable content only from the handle. */}
        {scrollable ? panel : <GestureDetector gesture={pan}>{panel}</GestureDetector>}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {
    position: 'absolute',
    left: INSET,
    right: INSET,
    borderRadius: PANEL_RADIUS,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handleArea: { alignItems: 'center', paddingTop: space.sm, paddingBottom: space.xs },
  handle: { width: 36, height: 5, borderRadius: 3 },
  scroll: { flexGrow: 0 },
  body: { paddingHorizontal: layout.gutter, paddingTop: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingBottom: space.lg },
  titles: { flex: 1, gap: 2 },
  footer: { paddingTop: space.xl },
});
