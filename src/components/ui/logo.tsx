import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

/** Geometry shared with the app icon: a dot with two ripples, open on the right like a "C". */
const DOT = 70;
const RINGS = [
  { r: 172, gapDeg: 100 },
  { r: 304, gapDeg: 86 },
];
const STROKE = 72;
const EXTENT = RINGS[1].r + STROKE / 2;
// The opening on the right makes the shape lighter there; shifting it right balances it optically.
const NUDGE = 0.05;

function arc(r: number, gapDeg: number) {
  const half = (gapDeg / 2) * (Math.PI / 180);
  const x = (r * Math.cos(half)).toFixed(2);
  const y = (r * Math.sin(half)).toFixed(2);
  return `M ${x} ${-y} A ${r} ${r} 0 1 0 ${x} ${y}`;
}

/** The Campaigns mark, in the accent colour unless told otherwise. Decorative. */
export function LogoMark({ size = 24, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const fill = color ?? colors.primary;
  const box = EXTENT * 2;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-EXTENT - box * NUDGE} ${-EXTENT} ${box} ${box}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Circle cx={0} cy={0} r={DOT} fill={fill} />
      {RINGS.map((ring) => (
        <Path key={ring.r} d={arc(ring.r, ring.gapDeg)} stroke={fill} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
}
