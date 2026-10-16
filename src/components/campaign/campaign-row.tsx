import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Text } from '@/components/ui/text';
import { categoryLabel, creatorTypeLabels } from '@/domain/categories';
import { fundingProgress } from '@/domain/money';
import type { CampaignSummary } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { motion, radius, space, spring, useTheme } from '@/theme';

import { categoryIcons } from './category-icon';

type Props = {
  campaign: CampaignSummary;
  /** Position in the list, used to stagger the entrance of the first few rows. */
  index?: number;
  onPress?: () => void;
};

/** Compact campaign card: category tint tile, title, creator, funding progress. */
export function CampaignRow({ campaign, index = 0, onPress }: Props) {
  const { categoryTint, colors } = useTheme();
  const CategoryIcon = categoryIcons[campaign.category];
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const delay = Math.min(index, motion.staggerCap) * motion.staggerMs;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness)}>
      <Card onPress={onPress} accessibilityLabel={`${campaign.title}, by ${campaign.creator.name}`}>
        <View style={styles.top}>
          <View style={[styles.tile, { backgroundColor: categoryTint(campaign.category) }]}>
            <CategoryIcon size={26} color={colors.textMuted} />
          </View>
          <View style={styles.text}>
            <Text variant="overline" color="textMuted" numberOfLines={1}>
              {categoryLabel(campaign.category)}
            </Text>
            <Text variant="title3" numberOfLines={2}>
              {campaign.title}
            </Text>
            <Text variant="footnote" color="textMuted" numberOfLines={1}>
              {campaign.creator.name} · {creatorTypeLabels[campaign.creator.type]}
            </Text>
          </View>
        </View>
        <View style={styles.progress}>
          <ProgressBar
            value={progress}
            delay={delay + 150}
            accessibilityLabel={`${formatPercent(progress)} funded`}
          />
          <View style={styles.meta}>
            <Text variant="subhead" tabular>
              {formatMoney(campaign.raisedCents)}
              <Text variant="subhead" color="textMuted">
                {` of ${formatMoney(campaign.goalCents)}`}
              </Text>
            </Text>
            <StatusPill status={campaign.status} />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

export function CampaignRowSkeleton() {
  return (
    <Card>
      <View style={styles.top}>
        <Skeleton width={64} height={64} radius={radius.md} />
        <View style={[styles.text, styles.skeletonText]}>
          <Skeleton height={16} width="90%" />
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="45%" />
        </View>
      </View>
      <View style={styles.progress}>
        <Skeleton height={6} radius={radius.pill} />
        <Skeleton height={14} width="40%" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: space.md },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xs,
  },
  text: { flex: 1, gap: space.xs },
  skeletonText: { gap: space.sm, paddingTop: 2 },
  progress: { gap: space.sm, marginTop: space.lg },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
