import { StyleSheet, View } from 'react-native';

import { CoverImage } from '@/components/campaign/cover-image';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import { fundingProgress } from '@/domain/money';
import type { Cents, CampaignSummary } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { radius, space } from '@/theme';

type Props = {
  campaign: CampaignSummary;
  /** Contribution being considered; shown as a lighter projected segment on the bar. */
  addCents?: Cents;
};

/** Compact campaign identity + funding, shown at the top of each backing step. */
export function CampaignStrip({ campaign, addCents = 0 }: Props) {
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const projected = fundingProgress(campaign.raisedCents + addCents, campaign.goalCents);
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <CoverImage image={campaign.cover} category={campaign.category} style={styles.thumb} />
        <View style={styles.titles}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text variant="footnote" color="textMuted" numberOfLines={1}>
            by {campaign.creator.name}
          </Text>
        </View>
      </View>
      <View style={styles.funding}>
        <ProgressBar
          value={progress}
          projected={addCents > 0 ? projected : undefined}
          animateOnMount={false}
          accessibilityLabel={`${formatPercent(progress)} funded`}
        />
        <View style={styles.meta}>
          <Text variant="footnote" color="textMuted" tabular>
            {`${formatMoney(campaign.raisedCents)} of ${formatMoney(campaign.goalCents)}`}
          </Text>
          <Text variant="footnote" color={addCents > 0 ? 'primary' : 'textMuted'} tabular>
            {addCents > 0 ? `${formatPercent(progress)} → ${formatPercent(projected)}` : formatPercent(progress)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  top: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  titles: { flex: 1, gap: 2 },
  funding: { gap: space.xs + 2 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
});
