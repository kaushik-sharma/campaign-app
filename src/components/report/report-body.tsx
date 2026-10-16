import { StyleSheet, View } from 'react-native';

import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { BookOpenIcon } from '@/components/ui/icons';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { channelLabels } from '@/domain/channels';
import { METRIC_GLOSSARY, type CampaignReport } from '@/domain/report';
import { formatCompact, formatDate, formatInteger, formatMoney, formatReachRange } from '@/lib/format';
import { layout, space } from '@/theme';

import { BarRow, Figure, Sparkline } from './charts';

const PHASE: Record<CampaignReport['phase'], { label: string; tone: 'success' | 'info' | 'neutral' | 'warning' }> = {
  final: { label: 'Final report', tone: 'success' },
  delivering: { label: 'Ads running', tone: 'info' },
  'not-started': { label: 'Ads not started', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'warning' },
};

/** The full report content, shared by the report screen and the creator's manage screen. */
export function ReportBody({ report }: { report: CampaignReport }) {
  const { money, measured, estimated } = report;
  const max = Math.max(money.raisedCents, 1);
  const pct = (n: number) => `${((n * 100) || 0).toFixed(n < 0.1 ? 2 : 1)}%`;

  return (
    <>
      <Section>
        <Card style={styles.summary}>
          <Badge label={PHASE[report.phase].label} tone={PHASE[report.phase].tone} dot />
          <Text variant="title2">{report.title}</Text>
          <Text variant="subhead" color="textMuted">
            {report.phase === 'delivering'
              ? `Day ${report.daysDelivered} of ${report.durationDays}${report.startedAt ? ` · started ${formatDate(report.startedAt)}` : ''}. Figures update as delivery is reported.`
              : report.phase === 'final'
                ? `The ${report.durationDays}-day ad run is complete${report.startedAt ? `, from ${formatDate(report.startedAt)}` : ''}.`
                : report.phase === 'refunded'
                  ? 'This campaign didn’t raise enough to run ads.'
                  : 'Ads haven’t started yet. Delivery figures appear here once they run.'}
          </Text>
        </Card>
      </Section>

      <Section title="Where the money went" description="Every dollar raised, from contribution to ad spend.">
        <Card style={styles.stack}>
          <BarRow label="Raised from backers" value={money.raisedCents} max={max} display={formatMoney(money.raisedCents)} tone="success" />
          <BarRow
            label={`Platform fee (${Math.round(demo.fees.platformPct * 100)}%)`}
            value={money.platformFeeCents}
            max={max}
            display={`− ${formatMoney(money.platformFeeCents)}`}
            tone="muted"
            delay={120}
          />
          <BarRow label="Ad budget" value={money.adBudgetCents} max={max} display={formatMoney(money.adBudgetCents)} delay={240} />
          <BarRow label="Spent on ads" value={money.spentCents} max={max} display={formatMoney(money.spentCents)} delay={360} />
          <BarRow
            label={report.phase === 'refunded' ? 'Refunded to backers' : 'Not yet spent'}
            value={money.unspentCents}
            max={max}
            display={formatMoney(money.unspentCents)}
            tone="muted"
            delay={480}
          />
          <Divider />
          <Text variant="footnote" color="textMuted">
            {money.unspentNote}
          </Text>
        </Card>
      </Section>

      <Section title="Reach" description="Measured figures come from ad networks. Estimates come from our assumptions.">
        <View style={styles.figures}>
          {measured ? (
            <>
              <Figure label="People reached" value={formatCompact(measured.reach)} kind="measured" />
              <Figure label="People reached" value={formatReachRange(estimated.reach)} kind="estimated" note="Projection for this budget" />
              <Figure label="Impressions" value={formatCompact(measured.impressions)} kind="measured" />
              <Figure label="Clicks" value={formatInteger(measured.clicks)} kind="measured" note={`${pct(measured.ctr)} CTR`} />
            </>
          ) : (
            <>
              <Figure label="People reached" value={formatReachRange(estimated.reach)} kind="estimated" note="Projection for this budget" />
              <Figure label="Impressions" value={formatCompact(estimated.impressions)} kind="estimated" />
            </>
          )}
        </View>
        {measured && (
          <Text variant="footnote" color="textMuted" style={styles.note}>
            {`Each person saw the ads ${measured.frequency}× on average.`}
          </Text>
        )}
      </Section>

      {measured && (
        <>
          <Section title="Delivery by channel">
            <Card style={styles.stack}>
              {measured.byChannel.map((ch, i) => (
                <BarRow
                  key={ch.channel}
                  label={channelLabels[ch.channel]}
                  value={ch.impressions}
                  max={Math.max(...measured.byChannel.map((c) => c.impressions))}
                  display={`${formatCompact(ch.impressions)} · ${formatMoney(ch.spendCents)}`}
                  delay={i * 120}
                />
              ))}
              <Text variant="caption" color="textMuted">
                Impressions · spend
              </Text>
            </Card>
          </Section>

          <Section title="Daily delivery">
            <Card style={styles.stack}>
              <Sparkline values={measured.daily.map((d) => d.impressions)} label={`Impressions per day over ${measured.daily.length} days`} />
              <View style={styles.axis}>
                <Text variant="caption" color="textMuted">
                  Day 1
                </Text>
                <Text variant="caption" color="textMuted">
                  {`Day ${measured.daily.length}`}
                </Text>
              </View>
            </Card>
          </Section>
        </>
      )}

      <Section title="What these mean">
        <Card padded={false} style={styles.glossary}>
          {METRIC_GLOSSARY.map((g, i) => (
            <View key={g.term}>
              {i > 0 && <Divider />}
              <Accordion title={g.term} icon={i === 0 ? BookOpenIcon : undefined}>
                <Text variant="subhead" color="textMuted">
                  {g.definition}
                </Text>
              </Accordion>
            </View>
          ))}
        </Card>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  summary: { gap: space.sm },
  stack: { gap: space.lg },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  note: { marginTop: space.sm },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  glossary: { paddingHorizontal: layout.cardPadding },
});
