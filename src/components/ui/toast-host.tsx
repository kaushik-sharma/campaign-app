import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { useToastStore, type Toast } from '@/stores/toast';
import { duration, easing, layout, radius, space, useTheme } from '@/theme';

import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from './icons';
import { Text } from './text';

const VISIBLE_MS = 2800;

function ToastView({ toast }: { toast: Toast }) {
  const { colors } = useTheme();
  const dismiss = useToastStore((s) => s.dismiss);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (toast.tone === 'success') haptics.success();
    if (toast.tone === 'error') haptics.error();
    const timer = setTimeout(() => dismiss(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  // Swipe down to dismiss early.
  const pan = Gesture.Pan()
    .onChange((e) => dragY.set(Math.max(0, dragY.get() + e.changeY)))
    .onEnd((e) => {
      if (dragY.get() > 24 || e.velocityY > 500) {
        scheduleOnRN(dismiss, toast.id);
      } else {
        dragY.set(withTiming(0, { duration: duration.fast, easing: easing.standard }));
      }
    });

  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.get() }] }));

  const Icon = toast.tone === 'success' ? CheckCircleIcon : toast.tone === 'error' ? WarningCircleIcon : InfoIcon;
  const iconColor =
    toast.tone === 'success' ? colors.success : toast.tone === 'error' ? colors.danger : colors.textInverse;

  // The enter/exit animation and the drag both move the toast, so they live on separate views.
  return (
    <Animated.View entering={FadeInDown.duration(duration.base).easing(easing.enter)} exiting={FadeOut.duration(duration.fast)}>
      <GestureDetector gesture={pan}>
        <Animated.View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.toast, { backgroundColor: colors.surfaceInverse }, dragStyle]}>
          <Icon size={20} color={iconColor} weight="fill" />
          <Text variant="subhead" color="textInverse" style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/** Mounted once at the root. Shows the latest toast floating near the bottom, clear of the tab bar. */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + layout.tabBarHeight + space.lg }]}>
      {current && <ToastView key={current.id} toast={current} />}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: layout.gutter, right: layout.gutter, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    maxWidth: 480,
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.18)',
  },
  message: { flexShrink: 1 },
});
