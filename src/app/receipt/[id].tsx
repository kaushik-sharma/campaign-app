import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ChargeTable, FundsSplit } from '@/components/backing/fee-breakdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { contributionStatusMeta, feesOf } from '@/domain/payments';
import type { Contribution } from '@/domain/types';
import { useContribution } from '@/features/contributions/queries';
import { formatDateTime, formatMoney } from '@/lib/format';
import { layout, radius, space } from '@/theme';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text variant="subhead" color="textMuted">
        {label}
      </Text>
      <Text variant="subhead" style={styles.detailValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const NOTES: Record<Contribution['status'], string> = {
  succeeded:
    'Your contribution pays for ads for this campaign. If it raises less than the minimum, or the ads can’t spend the whole budget, you’re refunded as described in the funding FAQ.',
  pending: 'Your bank is still confirming this payment. It counts toward the campaign once confirmed.',
  failed: 'This payment was declined, so you weren’t charged and nothing was added to the campaign.',
  cancelled: 'You canceled this payment before it was made. You weren’t charged.',
};

function ReceiptBody({ c }: { c: Contribution }) {
  const meta = contributionStatusMeta[c.status];
  const fees = feesOf(c);
  const rows: [string, string][] = [
    ['Receipt', c.receiptNumber],
    ['Date', formatDateTime(c.createdAt)],
    ...(c.settledAt && c.status === 'succeeded' && c.settledAt !== c.createdAt
      ? ([['Confirmed', formatDateTime(c.settledAt)]] as [string, string][])
      : []),
    ['Paid with', `Test card •••• ${c.cardLast4}`],
    ['Email', c.email || 'Not provided'],
    ['Shown publicly as', c.publicName ?? 'Anonymous backer'],
  ];

  return (
    <>
      <Section>
        <Card style={styles.summary}>
          <Badge label={meta.label} tone={meta.tone} dot />
          <View style={styles.amount}>
            <Text variant="display" tabular>
              {formatMoney(c.totalChargeCents, { showCents: true })}
            </Text>
            <Text variant="subhead" color="textMuted">
              {meta.charged ? (c.status === 'pending' ? 'authorized, awaiting confirmation' : 'charged') : 'not charged'}
            </Text>
          </View>
          <Divider />
          <View style={styles.campaign}>
            <Text variant="caption" color="textMuted">
              Contribution to
            </Text>
            <Text variant="title3">{c.campaignTitle}</Text>
          </View>
          {c.status === 'pending' && (
            <View style={styles.pending}>
              <ActivityIndicator />
              <Text variant="footnote" color="textMuted">
                Checking with your bank…
              </Text>
            </View>
          )}
        </Card>
      </Section>

      <Section title="Charges">
        <ChargeTable fees={fees} totalLabel={meta.charged ? 'Total charged' : 'Total (not charged)'} />
      </Section>

      {meta.charged && (
        <Section title="How it’s used">
          <Card>
            <FundsSplit fees={fees} />
          </Card>
        </Section>
      )}

      <Section title="Details">
        <Card padded={false}>
          {rows.map(([label, value], i) => (
            <View key={label}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              <DetailRow label={label} value={value} />
            </View>
          ))}
        </Card>
        <Text variant="footnote" color="textMuted" style={styles.note}>
          {`${NOTES[c.status]} Prototype receipt: no real money moved.`}
        </Text>
      </Section>

      <Section>
        <Button
          label="View campaign"
          variant="secondary"
          fullWidth
          onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: c.campaignId } })}
        />
        {c.status === 'succeeded' && (
          <Text variant="caption" color="textMuted" align="center" style={styles.note}>
            {`Ads are bought with ${Math.round((1 - demo.fees.platformPct) * 100)}% of your contribution.`}
          </Text>
        )}
      </Section>
    </>
  );
}

/** A single payment's receipt. Reachable from the result screen, payment history and Activity. */
export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useContribution(id, { poll: true });

  return (
    <Screen title="Receipt" back>
      {query.data ? (
        <ReceiptBody c={query.data} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      ) : (
        <SkeletonGroup style={styles.skeleton} label="Loading receipt">
          <Skeleton height={180} radius={radius.lg} />
          <Skeleton height={140} radius={radius.md} />
        </SkeletonGroup>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: space.md },
  amount: { gap: 2 },
  campaign: { gap: 2 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: space.md,
  },
  detailValue: { flex: 1, textAlign: 'right' },
  note: { marginTop: space.sm },
  skeleton: { paddingHorizontal: layout.gutter, gap: space.lg },
});
