import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { categoryLabel } from '@/domain/categories';
import { fundingProgress } from '@/domain/money';
import type { CampaignSummary } from '@/domain/types';
import { formatMoney, formatPercent, formatTimeLeft } from '@/lib/format';
import { radius, space } from '@/theme';

import { CoverImage } from './cover-image';

type Props = { campaign: CampaignSummary; onPress?: () => void };

/** Home's lead story: one campaign given editorial weight. The message comes first, money second. */
export function LeadStoryCard({ campaign, onPress }: Props) {
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const timeLeft = formatTimeLeft(campaign.fundingEndsAt);

  return (
    <Card
      padded={false}
      onPress={onPress}
      accessibilityLabel={`${campaign.title}. ${categoryLabel(campaign.category)}, by ${campaign.creator.name}. ${formatPercent(progress)} funded.`}
      style={styles.card}>
      <CoverImage image={campaign.cover} category={campaign.category} style={styles.cover} />
      <View style={styles.body}>
        <Text variant="overline" color="textMuted" numberOfLines={1}>
          {categoryLabel(campaign.category)} · {campaign.creator.name}
        </Text>
        <Text variant="storyTitle" numberOfLines={3}>
          {campaign.title}
        </Text>
        <Text variant="subhead" color="textMuted" numberOfLines={2}>
          {campaign.summary}
        </Text>
        <View style={styles.funding}>
          <ProgressBar value={progress} delay={250} />
          <View style={styles.meta}>
            <Text variant="subhead" tabular>
              {formatMoney(campaign.raisedCents)}
              <Text variant="subhead" color="textMuted">{` of ${formatMoney(campaign.goalCents)}`}</Text>
            </Text>
            {timeLeft && (
              <Text variant="subhead" color="textMuted">
                {timeLeft}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

export function LeadStorySkeleton() {
  return (
    <Card padded={false} style={styles.card}>
      <Skeleton height={240} radius={0} />
      <View style={styles.body}>
        <Skeleton width="45%" height={12} />
        <Skeleton height={24} />
        <Skeleton width="70%" height={24} />
        <Skeleton height={14} />
        <Skeleton height={6} radius={radius.pill} style={{ marginTop: space.md }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 4 / 3 },
  body: { padding: space.xl, gap: space.sm },
  funding: { gap: space.sm, marginTop: space.md },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
