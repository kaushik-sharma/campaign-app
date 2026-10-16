import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import { fundingProgress } from '@/domain/money';
import type { Campaign } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { layout, space, spring, useTheme } from '@/theme';

type Props = {
  campaign: Campaign;
  /** 1 when the inline funding panel has scrolled off screen. Driven on the UI thread. */
  visible: SharedValue<number>;
  onBack: () => void;
};

/**
 * Compact funding bar that slides up once the main funding panel leaves the screen, so the
 * action stays reachable without covering the story while the panel is visible.
 */
export function StickyBackBar({ campaign, visible, onBack }: Props) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(visible.get() ? 0 : 140, spring.snappy) }],
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom + space.sm,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          boxShadow: scheme === 'dark' ? undefined : '0px -6px 20px rgba(16, 18, 22, 0.08)',
        },
        style,
      ]}>
      <View style={styles.info}>
        <Text variant="subhead" tabular numberOfLines={1}>
          {formatMoney(campaign.raisedCents)}
          <Text variant="subhead" color="textMuted">{` · ${formatPercent(progress)} funded`}</Text>
        </Text>
        <ProgressBar value={progress} height={4} animateOnMount={false} />
      </View>
      <Button label="Back this campaign" onPress={onBack} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.md,
    paddingHorizontal: layout.gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, gap: space.xs },
});
