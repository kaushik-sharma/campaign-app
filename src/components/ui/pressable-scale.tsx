import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { motion, spring } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. Defaults to the button scale token. */
  scaleTo?: number;
  /** Haptic fired on press. */
  haptic?: 'selection' | 'tap' | 'medium' | null;
};

/**
 * The base for every tappable element: a spring scale on the UI thread plus optional haptics.
 * Reduce motion is handled by Reanimated (springs resolve instantly when it is on).
 */
export function PressableScale({
  scaleTo = motion.pressScale.button,
  haptic = null,
  onPressIn,
  onPressOut,
  onPress,
  style,
  disabled,
  accessibilityRole = 'button',
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, scaleTo]) }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        pressed.set(withSpring(1, spring.press));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        pressed.set(withSpring(0, spring.press));
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
}
