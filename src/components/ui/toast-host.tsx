import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/lib/haptics';
import { useToastStore, type Toast } from '@/stores/toast';
import { duration, layout, radius, space, spring, useTheme } from '@/theme';

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

  // Swipe up to dismiss early.
  const pan = Gesture.Pan()
    .onChange((e) => dragY.set(Math.min(0, dragY.get() + e.changeY)))
    .onEnd((e) => {
      if (dragY.get() < -24 || e.velocityY < -500) {
        scheduleOnRN(dismiss, toast.id);
      } else {
        dragY.set(withSpring(0, spring.snappy));
      }
    });

  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragY.get() }] }));

  const Icon = toast.tone === 'success' ? CheckCircleIcon : toast.tone === 'error' ? WarningCircleIcon : InfoIcon;
  const iconColor =
    toast.tone === 'success' ? colors.success : toast.tone === 'error' ? colors.danger : colors.textInverse;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={SlideInUp.springify().damping(spring.snappy.damping).stiffness(spring.snappy.stiffness)}
        exiting={FadeOut.duration(duration.fast)}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: colors.surfaceInverse }, dragStyle]}>
        <Icon size={20} color={iconColor} weight="fill" />
        <Text variant="subhead" color="textInverse" style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

/** Mounted once at the root. Shows the latest toast below the status bar. */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + space.sm }]}>
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
