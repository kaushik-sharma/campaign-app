import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/lib/reduced-motion';
import { useTheme } from '@/theme';

const COUNT = 32;
const SECONDS = 1.9;
const GRAVITY = 1100;

type Piece = { vx: number; vy: number; spin: number; w: number; h: number; round: boolean; color: number };

function makePieces(): Piece[] {
  return Array.from({ length: COUNT }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const speed = 420 + Math.random() * 420;
    const round = Math.random() < 0.3;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (Math.random() - 0.5) * 1440,
      w: round ? 7 : 6,
      h: round ? 7 : 11,
      round,
      color: Math.floor(Math.random() * 5),
    };
  });
}

function Particle({ piece, progress, color }: { piece: Piece; progress: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => {
    const t = progress.get();
    const s = t * SECONDS;
    return {
      opacity: t === 0 ? 0 : t < 0.7 ? 1 : (1 - t) / 0.3,
      transform: [
        { translateX: piece.vx * s * 0.8 },
        { translateY: piece.vy * s + 0.5 * GRAVITY * s * s },
        { rotate: `${piece.spin * s}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: piece.w, height: piece.h, borderRadius: piece.round ? piece.w / 2 : 1.5, backgroundColor: color },
        style,
      ]}
    />
  );
}

/**
 * A short confetti burst from the centre of its container, on the UI thread. Not rendered with
 * reduce motion on.
 */
export function Confetti({ fire, delay = 0 }: { fire: boolean; delay?: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [pieces] = useState(makePieces);
  const palette = [colors.primary, colors.success, colors.warning, colors.danger, '#C9A227'];

  useEffect(() => {
    if (!fire || reduced) return;
    progress.set(0);
    progress.set(withDelay(delay, withTiming(1, { duration: SECONDS * 1000, easing: Easing.linear })));
  }, [fire, reduced, delay, progress]);

  if (reduced) return null;
  return (
    <View pointerEvents="none" style={styles.root} importantForAccessibility="no-hide-descendants">
      {pieces.map((piece, i) => (
        <Particle key={i} piece={piece} progress={progress} color={palette[piece.color]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 },
  piece: { position: 'absolute' },
});
