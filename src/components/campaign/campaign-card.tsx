import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EstimatedReach } from '@/components/ui/estimate';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Text } from '@/components/ui/text';
import { categoryLabel, creatorTypeLabels } from '@/domain/categories';
import { acceptsContributions } from '@/domain/lifecycle';
import { fundingProgress } from '@/domain/money';
import type { CampaignSummary } from '@/domain/types';
import { useOpenCampaign } from '@/features/campaigns/navigation';
import { formatMoney, formatPercent, formatTimeLeft } from '@/lib/format';
import { motion, radius, space, spring } from '@/theme';

import { CoverImage } from './cover-image';

/**
 * Full campaign card for Explore: cover, category, title, creator, summary, funding, estimated
 * reach at goal and one clear action (PRD card spec).
 */
export function CampaignCard({ campaign, index = 0 }: { campaign: CampaignSummary; index?: number }) {
  const open = useOpenCampaign();
  const coverRef = useRef<View>(null);
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const canBack = acceptsContributions(campaign.status);
  const timeLeft = campaign.status === 'funding' ? formatTimeLeft(campaign.fundingEndsAt) : null;
  const delay = Math.min(index, motion.staggerCap) * motion.staggerMs;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness)}>
      <Card
        padded={false}
        onPress={() => open(campaign, { cover: coverRef, radius: radius.lg })}
        accessibilityLabel={`${campaign.title}, by ${campaign.creator.name}. ${formatPercent(progress)} funded.`}
        style={styles.card}>
        <View ref={coverRef} collapsable={false}>
          <CoverImage image={campaign.cover} category={campaign.category} style={styles.cover} />
        </View>
        <View style={styles.body}>
          <Text variant="overline" color="textMuted" numberOfLines={1}>
            {categoryLabel(campaign.category)} · {creatorTypeLabels[campaign.creator.type]}
          </Text>
          <View style={styles.titles}>
            <Text variant="title3" numberOfLines={2}>
              {campaign.title}
            </Text>
            <Text variant="footnote" color="textMuted" numberOfLines={1}>
              by {campaign.creator.name}
            </Text>
          </View>
          <Text variant="subhead" color="textMuted" numberOfLines={2}>
            {campaign.summary}
          </Text>

          <View style={styles.funding}>
            <ProgressBar value={progress} delay={delay + 200} />
            <View style={styles.meta}>
              <Text variant="subhead" tabular>
                {formatMoney(campaign.raisedCents)}
                <Text variant="subhead" color="textMuted">{` of ${formatMoney(campaign.goalCents)}`}</Text>
              </Text>
              <Text variant="subhead" color="textMuted">
                {timeLeft ?? formatPercent(progress)}
              </Text>
            </View>
            <EstimatedReach amountCents={campaign.goalCents} variant="footnote" suffix="people at goal" />
          </View>

          <View style={styles.footer}>
            {canBack ? (
              <Button
                label="Back this campaign"
                size="sm"
                onPress={() => open(campaign, { cover: coverRef, radius: radius.lg, back: true })}
              />
            ) : (
              <StatusPill status={campaign.status} />
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

export function CampaignCardSkeleton() {
  return (
    <Card padded={false} style={styles.card}>
      <Skeleton height={180} radius={0} />
      <View style={styles.body}>
        <Skeleton width="40%" height={10} />
        <Skeleton height={18} />
        <Skeleton width="65%" height={18} />
        <Skeleton height={6} radius={radius.pill} style={{ marginTop: space.md }} />
        <Skeleton width="45%" height={14} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: space.lg, gap: space.sm },
  titles: { gap: 2 },
  funding: { gap: space.sm, marginTop: space.sm },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { marginTop: space.sm, flexDirection: 'row' },
});
