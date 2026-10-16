import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { ReceiptIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { contributionStatusMeta } from '@/domain/payments';
import type { Contribution } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { contributionKeys, useMyContributions } from '@/features/contributions/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { layout, motion, radius, space } from '@/theme';

function PaymentRow({ c }: { c: Contribution }) {
  const meta = contributionStatusMeta[c.status];
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: c.id } })}
      scaleTo={motion.pressScale.row}
      accessibilityLabel={`${c.campaignTitle}, ${formatMoney(c.totalChargeCents, { showCents: true })}, ${meta.label}, ${formatDate(c.createdAt)}`}
      style={styles.row}>
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {c.campaignTitle}
        </Text>
        <Text variant="footnote" color="textMuted">
          {`${formatDate(c.createdAt)} · ${c.receiptNumber}`}
        </Text>
      </View>
      <View style={styles.rowEnd}>
        <Text
          variant="bodyStrong"
          tabular
          color={meta.charged ? 'text' : 'textMuted'}
          style={!meta.charged && styles.struck}>
          {formatMoney(c.totalChargeCents, { showCents: true })}
        </Text>
        <View>
          <Badge label={meta.label} tone={meta.tone} />
        </View>
      </View>
    </PressableScale>
  );
}

/** Payment history: every attempt, with its receipt one tap away. */
export default function PaymentsScreen() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const query = useMyContributions();
  const [refreshing, setRefreshing] = useState(false);
  const payments = query.data ?? [];
  const totalCents = payments.filter((c) => c.status === 'succeeded').reduce((sum, c) => sum + c.amountCents, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: contributionKeys.mine() });
    setRefreshing(false);
  };

  return (
    <Screen title="Payments" back onRefresh={onRefresh} refreshing={refreshing}>
      {!user && (
        <Section>
          <Card tone="sunken" elevation="e0" style={styles.guest}>
            <Text variant="subhead" color="textMuted">
              These are guest payments made on this device. Sign in to keep future receipts with your account.
            </Text>
            <Button
              label="Sign in"
              variant="secondary"
              size="sm"
              onPress={() => router.push({ pathname: '/auth', params: { reason: 'payments' } })}
            />
          </Card>
        </Section>
      )}

      {query.isPending ? (
        <Section>
          <SkeletonGroup style={styles.skeleton} label="Loading payments">
            <Skeleton height={64} radius={radius.md} />
            <Skeleton height={64} radius={radius.md} />
          </SkeletonGroup>
        </Section>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="No payments yet"
          message="When you back a campaign, its receipt appears here."
          action={{ label: 'Explore campaigns', onPress: () => router.navigate('/explore') }}
        />
      ) : (
        <>
          <Section>
            <View style={styles.total}>
              <Text variant="caption" color="textMuted">
                Total contributed
              </Text>
              <Text variant="amount" tabular>
                {formatMoney(totalCents, { showCents: true })}
              </Text>
              <Text variant="footnote" color="textMuted">
                Contributions only, excluding card processing.
              </Text>
            </View>
          </Section>
          <Section title="History">
            <Card padded={false}>
              {payments.map((c, i) => (
                <View key={c.id}>
                  {i > 0 && <Divider inset={layout.cardPadding} />}
                  <PaymentRow c={c} />
                </View>
              ))}
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: { gap: space.md },
  skeleton: { gap: space.sm },
  total: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: layout.cardPadding },
  rowText: { flex: 1, gap: 2 },
  rowEnd: { alignItems: 'flex-end', gap: space.xs },
  struck: { textDecorationLine: 'line-through' },
});
