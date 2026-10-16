import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import type { CategoryId, ImageAsset } from '@/domain/types';
import type { HeroRect } from '@/stores/hero';
import { spring } from '@/theme';

import { CoverImage } from '../cover-image';

type Props = {
  image: ImageAsset | null;
  category: CategoryId;
  height: number;
  scrollY: SharedValue<number>;
  /** Where the tapped card's cover was on screen. When set, the cover flies from there. */
  hero: HeroRect | null;
};

/**
 * Detail page cover.
 * - Entrance: if opened from a card, the image springs from the card's on-screen rect to the
 *   full-width header (a shared-element-style transition that runs in Expo Go).
 * - Scroll: parallax while scrolling down, stretches to fill on pull-down.
 * All of it is computed on the UI thread from two shared values.
 */
export function HeroCover({ image, category, height, scrollY, hero }: Props) {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(hero ? 0 : 1);

  useEffect(() => {
    if (hero) progress.set(withSpring(1, spring.hero));
  }, [hero, progress]);

  const imageStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const y = scrollY.get();
    // Final placement: parallax at 45% speed when scrolling, pinned and stretched when pulled.
    const finalTop = y < 0 ? y : y * 0.45;
    const finalHeight = y < 0 ? height - y : height;
    const from = hero ?? { x: 0, y: finalTop, width, height: finalHeight, radius: 0 };
    return {
      left: from.x * (1 - p),
      top: from.y + (finalTop - from.y) * p,
      width: from.width + (width - from.width) * p,
      height: from.height + (finalHeight - from.height) * p,
      borderRadius: from.radius * (1 - p),
    };
  });

  // Lift the cover above the page content while it flies in, then let the content sheet overlap it.
  const containerStyle = useAnimatedStyle(() => ({ zIndex: progress.get() < 0.98 ? 10 : 0 }));

  return (
    <Animated.View pointerEvents="none" style={[{ height }, containerStyle]}>
      <Animated.View style={[styles.image, imageStyle]}>
        <CoverImage image={image} category={category} style={StyleSheet.absoluteFill} />
        {/* Keeps the status bar and floating buttons legible on bright photos. */}
        <LinearGradient colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']} style={styles.shade} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { position: 'absolute', overflow: 'hidden' },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
});
