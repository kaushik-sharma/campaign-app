import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { duration, easing, radius, space, useTheme } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** One labelled horizontal bar that grows in from zero. */
export function BarRow({
  label,
  value,
  max,
  display,
  delay = 0,
  tone = 'primary',
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  delay?: number;
  tone?: 'primary' | 'muted' | 'success';
}) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const fill = useSharedValue(0);
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  useEffect(() => {
    fill.set(withDelay(delay, withTiming(share, { duration: duration.counter, easing: easing.enter })));
  }, [share, delay, fill]);

  const style = useAnimatedStyle(() => ({ width: width.get() * fill.get() }));
  const color = tone === 'muted' ? colors.borderStrong : tone === 'success' ? colors.success : colors.primary;

  return (
    <View style={styles.bar} accessible accessibilityLabel={`${label}: ${display}`}>
      <View style={styles.barLabels}>
        <Text variant="subhead" style={styles.flex} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="subhead" tabular>
          {display}
        </Text>
      </View>
      <View onLayout={(e) => width.set(e.nativeEvent.layout.width)} style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, style]} />
      </View>
    </View>
  );
}

/**
 * Daily delivery as a line with a soft area under it. The line draws itself left to right; the
 * area fades in behind it.
 */
export function Sparkline({ values, height = 96, label }: { values: number[]; height?: number; label: string }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const draw = useSharedValue(0);

  useEffect(() => {
    draw.set(0);
    draw.set(withDelay(200, withTiming(1, { duration: duration.counter * 1.4, easing: easing.standard })));
  }, [values.length, width, draw]);

  const max = Math.max(1, ...values);
  const pad = 4;
  const points = values.map((v, i) => ({
    x: values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - pad * 2) + pad,
    y: height - pad - (v / max) * (height - pad * 2),
  }));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L${points.at(-1)!.x.toFixed(1)} ${height} L${points[0].x.toFixed(1)} ${height} Z` : '';
  const length = points.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) : 0), 0);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - draw.get()) }));
  const areaProps = useAnimatedProps(() => ({ opacity: draw.get() }));

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={label}>
      {width > 0 && points.length > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <AnimatedPath d={area} fill="url(#area)" animatedProps={areaProps} />
          <AnimatedPath
            d={line}
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={length}
            animatedProps={lineProps}
          />
        </Svg>
      )}
    </View>
  );
}

/**
 * A headline figure. Measured figures are solid with a "Measured" tag; estimates carry "≈", a
 * dashed outline and an "Est." tag, so the two can never be confused.
 */
export function Figure({ label, value, kind, note }: { label: string; value: string; kind: 'measured' | 'estimated'; note?: string }) {
  const { colors } = useTheme();
  const estimated = kind === 'estimated';
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${estimated ? 'estimated, about ' : 'measured, '}${value}${note ? `. ${note}` : ''}`}
      style={[
        styles.figure,
        estimated
          ? { borderColor: colors.borderStrong, borderStyle: 'dashed' }
          : { borderColor: colors.border, backgroundColor: colors.surface },
      ]}>
      <View style={styles.figureTop}>
        <Text variant="caption" color="textMuted" style={styles.flex} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.tag, { backgroundColor: estimated ? colors.surfaceSunken : colors.successSoft }]}>
          <Text variant="caption" color={estimated ? 'textMuted' : 'success'} maxFontSizeMultiplier={1.1}>
            {estimated ? 'Est.' : 'Measured'}
          </Text>
        </View>
      </View>
      <Text variant="title2" tabular color={estimated ? 'textMuted' : 'text'}>
        {estimated ? `≈ ${value}` : value}
      </Text>
      {note && (
        <Text variant="caption" color="textMuted">
          {note}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { gap: space.xs + 2 },
  barLabels: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  figure: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderRadius: radius.md, padding: space.md, gap: 4 },
  figureTop: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.xs },
});
