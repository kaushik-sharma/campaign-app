import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { categoryLabel } from '@/domain/categories';
import { fundingProgress } from '@/domain/money';
import type { CampaignSummary } from '@/domain/types';
import { useOpenCampaign } from '@/features/campaigns/navigation';
import { formatPercent, formatTimeLeft } from '@/lib/format';
import { layout, motion, radius, space, spring } from '@/theme';

import { CoverImage } from './cover-image';

const CARD_WIDTH = 248;
const GAP = space.md;

type Variant = 'deadline' | 'promoting';

function metaLine(c: CampaignSummary, variant: Variant): string {
  const progress = fundingProgress(c.raisedCents, c.goalCents);
  if (variant === 'promoting') return `Ads live · ${c.durationDays}-day run`;
  return [formatPercent(progress) + ' funded', formatTimeLeft(c.fundingEndsAt)].filter(Boolean).join(' · ');
}

function RailCard({ campaign, variant, index }: { campaign: CampaignSummary; variant: Variant; index: number }) {
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const open = useOpenCampaign();
  const coverRef = useRef<View>(null);
  return (
    <Animated.View
      entering={FadeInRight.delay(Math.min(index, motion.staggerCap) * motion.staggerMs + 120)
        .springify()
        .damping(spring.gentle.damping)
        .stiffness(spring.gentle.stiffness)}>
      <Card
        padded={false}
        onPress={() => open(campaign, { cover: coverRef, radius: radius.lg })}
        accessibilityLabel={`${campaign.title}, by ${campaign.creator.name}. ${metaLine(campaign, variant)}.`}
        style={styles.card}>
        <View ref={coverRef} collapsable={false}>
          <CoverImage image={campaign.cover} category={campaign.category} style={styles.cover} />
        </View>
        <View style={styles.body}>
          <Text variant="overline" color="textMuted" numberOfLines={1}>
            {categoryLabel(campaign.category)}
          </Text>
          <Text variant="title3" numberOfLines={2} style={styles.title}>
            {campaign.title}
          </Text>
          <ProgressBar value={variant === 'promoting' ? 1 : progress} height={4} delay={300 + index * 60} />
          <Text variant="caption" color={variant === 'promoting' ? 'success' : 'textMuted'} numberOfLines={1}>
            {metaLine(campaign, variant)}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

type RailProps = {
  title: string;
  description?: string;
  items: CampaignSummary[];
  variant: Variant;
};

/** A short, horizontally scrolling section of campaign cards. Snaps card by card. */
export function Rail({ title, description, items, variant }: RailProps) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="title2" accessibilityRole="header">
          {title}
        </Text>
        {description && (
          <Text variant="subhead" color="textMuted">
            {description}
          </Text>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.track}>
        {items.map((c, i) => (
          <RailCard key={c.id} campaign={c} variant={variant} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

export function RailSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Skeleton width={140} height={20} />
      </View>
      <View style={styles.track}>
        {[0, 1].map((i) => (
          <Card key={i} padded={false} style={styles.card}>
            <Skeleton height={140} radius={0} />
            <View style={styles.body}>
              <Skeleton width="40%" height={10} />
              <Skeleton height={16} />
              <Skeleton width="70%" height={16} />
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, marginBottom: layout.sectionGap },
  header: { paddingHorizontal: layout.gutter, gap: 2 },
  track: { flexDirection: 'row', gap: GAP, paddingHorizontal: layout.gutter, paddingBottom: space.sm },
  card: { width: CARD_WIDTH, overflow: 'hidden' },
  cover: { width: '100%', height: 140 },
  body: { padding: space.md, gap: space.sm },
  title: { minHeight: 44 },
});
