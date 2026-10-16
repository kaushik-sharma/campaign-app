import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ChartBarIcon, CheckIcon, MegaphoneSimpleIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { channelLabels } from '@/domain/channels';
import { statusMeta } from '@/domain/lifecycle';
import type { Campaign, Channel } from '@/domain/types';
import { formatDate, formatMoney } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

function Bullet({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bullet}>
      <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
      <Text variant="subhead" color="textMuted" style={styles.flex}>
        {children}
      </Text>
    </View>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="overline" color="textMuted">
      {children}
    </Text>
  );
}

/** Where each dollar goes, refunds, and the amplification-not-donation rule. */
export function UseOfFunds({ campaign }: { campaign: Campaign }) {
  const { colors } = useTheme();
  const adPct = Math.round((1 - demo.fees.platformPct) * 100);
  const feePct = 100 - adPct;
  const minimum = formatMoney(demo.funding.minimumToDistributeCents);

  return (
    <Accordion title="Where your money goes" subtitle={`${adPct}% pays for ads`} icon={ChartBarIcon}>
      <View style={styles.section}>
        <View style={[styles.callout, { backgroundColor: colors.primarySoft }]}>
          <Text variant="subhead" color="primary">
            {`Your contribution pays for ads that spread this message. It isn’t a donation to ${campaign.creator.name} or the cause.`}
          </Text>
        </View>

        <View style={styles.split} accessible accessibilityLabel={`${adPct}% advertising, ${feePct}% platform fee`}>
          <View style={[styles.splitBar, { flex: adPct, backgroundColor: colors.primary }]} />
          <View style={[styles.splitBar, { flex: feePct, backgroundColor: colors.borderStrong }]} />
        </View>
        <View style={styles.legend}>
          <Text variant="caption">{`${adPct}% advertising`}</Text>
          <Text variant="caption" color="textMuted">{`${feePct}% platform fee`}</Text>
        </View>

        <View style={styles.bullets}>
          <Bullet>{`Advertising: ${adPct}% of funds raised buys ad placements for this message.`}</Bullet>
          <Bullet>{`Platform fee: ${feePct}% covers review, ad setup and reporting.`}</Bullet>
          <Bullet>{`Card processing (${(demo.fees.processingPct * 100).toFixed(1)}% + $${(demo.fees.processingFixedCents / 100).toFixed(2)}) is added at checkout, so your full contribution goes into the pool.`}</Bullet>
          <Bullet>Allocation follows the creator’s channel split below. Our team may rebalance it during ad setup to improve delivery.</Bullet>
          <Bullet>{`If the goal isn’t reached, funds still pay for a smaller run, unless less than ${minimum} was raised. Then every backer is refunded.`}</Bullet>
          <Bullet>If ads can’t spend the full budget, the unspent amount is refunded to backers in proportion to what they gave.</Bullet>
        </View>
        <PressableScale onPress={() => router.push({ pathname: '/info/[slug]', params: { slug: 'faq' } })} scaleTo={0.97} accessibilityRole="link" style={styles.link}>
          <Text variant="subhead" color="primary">
            Read the funding FAQ
          </Text>
        </PressableScale>
      </View>
    </Accordion>
  );
}

/** Intended audience, channels and the creator-chosen vs platform-finalized distinction. */
export function AudienceDistribution({ campaign }: { campaign: Campaign }) {
  const { colors } = useTheme();
  const { audience } = campaign;
  const channels = Object.entries(audience.budgetSplit) as [Channel, number][];

  return (
    <Accordion title="Who this will reach" subtitle={audience.locations.slice(0, 2).join(', ')} icon={MegaphoneSimpleIcon}>
      <View style={styles.section}>
        <Badge label="Chosen by the creator · finalized during review" tone="info" />

        <View style={styles.group}>
          <Label>Where</Label>
          <View style={styles.tags}>
            {audience.locations.map((l) => (
              <Badge key={l} label={l} />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <Label>Who</Label>
          <Text variant="subhead">{`Ages ${audience.ageRange[0]}–${audience.ageRange[1]} · interested in ${audience.interests.join(', ').toLowerCase()}`}</Text>
        </View>

        <View style={styles.group}>
          <Label>Channels and budget split</Label>
          {channels.map(([channel, pct]) => (
            <View key={channel} style={styles.channel}>
              <Text variant="subhead" style={styles.channelLabel}>
                {channelLabels[channel]}
              </Text>
              <View style={[styles.channelTrack, { backgroundColor: colors.surfaceSunken }]}>
                <View style={[styles.channelFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text variant="caption" color="textMuted" tabular style={styles.channelPct}>
                {pct}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.group}>
          <Label>How long</Label>
          <Text variant="subhead">{`${campaign.durationDays}-day ad run once distribution starts`}</Text>
        </View>

        <View style={styles.group}>
          <Label>Privacy and ad disclosure</Label>
          <Bullet>Ads target broad groups by location, age and interests. Backers’ details are never shared with advertisers.</Bullet>
          <Bullet>Every ad is labelled as sponsored and links back to this page.</Bullet>
          <Bullet>Reach is estimated. Actual delivery depends on ad inventory, prices and performance.</Bullet>
        </View>
      </View>
    </Accordion>
  );
}

/** What review covers, the campaign's actual review history, and what review is not. */
export function ReviewTrust({ campaign }: { campaign: Campaign }) {
  const { colors } = useTheme();
  return (
    <Accordion title="Review & trust" subtitle="How this campaign was checked" icon={ShieldCheckIcon}>
      <View style={styles.section}>
        <View style={styles.group}>
          <Label>What review checks</Label>
          {[
            'The story’s claims match the sources it cites',
            'Sources are publicly accessible',
            'Images and ad copy follow the community guidelines',
            'Targeting is appropriate for the message',
          ].map((item) => (
            <View key={item} style={styles.bullet}>
              <CheckIcon size={16} color={colors.success} weight="bold" />
              <Text variant="subhead" style={styles.flex}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.group}>
          <Label>This campaign’s history</Label>
          {campaign.history.map((event, i) => (
            <View key={`${event.status}-${i}`} style={styles.historyRow}>
              <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
              <Text variant="subhead" style={styles.flex}>
                {statusMeta[event.status].label}
              </Text>
              <Text variant="caption" color="textMuted">
                {formatDate(event.at)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.callout, { backgroundColor: colors.surfaceSunken }]}>
          <Text variant="subhead" color="textMuted">
            Review is not an independent fact-check or an endorsement. Read the sources and decide for
            yourself.
          </Text>
        </View>

        <View style={styles.group}>
          <Label>Distribution partners</Label>
          <Text variant="subhead" color="textMuted">
            Ads run on established social, search and news-site ad networks. The networks used are named in
            the campaign’s final report.
          </Text>
        </View>
      </View>
    </Accordion>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.lg },
  group: { gap: space.sm },
  callout: { padding: space.md, borderRadius: radius.md },
  split: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  splitBar: { height: '100%' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -space.sm },
  bullets: { gap: space.sm },
  bullet: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 9 },
  flex: { flex: 1 },
  link: { alignSelf: 'flex-start', paddingVertical: space.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  channel: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  channelLabel: { width: 112 },
  channelTrack: { flex: 1, height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  channelFill: { height: '100%', borderRadius: radius.pill },
  channelPct: { width: 36, textAlign: 'right' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
});
