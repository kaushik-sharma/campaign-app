import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { CategoryId, ImageAsset } from '@/domain/types';
import type { HeroRect } from '@/stores/hero';

import { CoverImage } from '../cover-image';

type CoverProps = {
  image: ImageAsset | null;
  category: CategoryId;
  height: number;
};

/** The cover at its full size. Never resized: Android's image view reloads (and re-fades) on every size change. */
function CoverArt({ image, category, height }: CoverProps) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ width, height }}>
      <CoverImage image={image} category={category} style={StyleSheet.absoluteFill} />
      {/* Keeps the status bar and floating buttons legible on bright photos. */}
      <LinearGradient colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']} style={styles.shade} />
    </View>
  );
}

/**
 * Detail page cover: parallax while scrolling down, stretches to fill on pull-down.
 * Both are transforms computed on the UI thread from the scroll position.
 */
export function HeroCover({ scrollY, landed, ...cover }: CoverProps & {
  scrollY: SharedValue<number>;
  /** 0 while the flying copy (HeroFlight) is on screen, 1 once it has landed here. */
  landed: SharedValue<number>;
}) {
  const { height } = cover;
  const imageStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    // Pulled down: scale about the centre so the top edge stays pinned to the top of the screen.
    if (y < 0) return { opacity: landed.get(), transform: [{ translateY: y / 2 }, { scale: (height - y) / height }] };
    return { opacity: landed.get(), transform: [{ translateY: y * 0.45 }] };
  });

  return (
    <View pointerEvents="none" style={{ height }}>
      <Animated.View style={imageStyle}>
        <CoverArt {...cover} />
      </Animated.View>
    </View>
  );
}

/**
 * The card → detail transition: a copy of the cover flies from the tapped card's on-screen rect to
 * the top of the page, above the content, then hides as the real cover appears in its place.
 * Only the clipping frame changes size; the image inside keeps its full size and is moved and
 * scaled with transforms, so it never reloads mid-flight.
 */
export function HeroFlight({ rect, progress, landed, ...cover }: CoverProps & {
  rect: HeroRect;
  /** 0 at the card, 1 at the top of the page. */
  progress: SharedValue<number>;
  landed: SharedValue<number>;
}) {
  const { width } = useWindowDimensions();
  const { height } = cover;

  const frameStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      left: rect.x * (1 - p),
      top: rect.y * (1 - p),
      width: rect.width + (width - rect.width) * p,
      height: rect.height + (height - rect.height) * p,
      borderRadius: rect.radius * (1 - p),
      opacity: 1 - landed.get(),
    };
  });
  // Scale the full-size cover to fill the frame, centred, as `contentFit="cover"` would.
  const artStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const w = rect.width + (width - rect.width) * p;
    const h = rect.height + (height - rect.height) * p;
    return {
      transform: [{ translateX: (w - width) / 2 }, { translateY: (h - height) / 2 }, { scale: Math.max(w / width, h / height) }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.frame, frameStyle]}>
      <Animated.View style={artStyle}>
        <CoverArt {...cover} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', overflow: 'hidden' },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
});
