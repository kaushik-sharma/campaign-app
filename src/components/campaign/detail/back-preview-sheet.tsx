import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { EstimatedReach } from '@/components/ui/estimate';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { computeFees } from '@/domain/money';
import type { Campaign } from '@/domain/types';
import { formatMoney } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

const EXAMPLE_CENTS = 2_500;

/**
 * Stand-in for the backing flow until checkout ships (Phase 3): shows exactly what a $25
 * contribution pays for, so the button is never a dead end.
 */
export function BackPreviewSheet({
  campaign,
  open,
  onClose,
}: {
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const fees = computeFees(EXAMPLE_CENTS);
  const rows: [string, string, boolean?][] = [
    ['Your contribution', formatMoney(fees.contributionCents, { showCents: true })],
    ['Card processing', formatMoney(fees.processingFeeCents, { showCents: true })],
    ['You pay', formatMoney(fees.totalChargeCents, { showCents: true }), true],
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Back this campaign"
      subtitle={campaign.title}
      footer={<Button label="Got it" variant="secondary" fullWidth onPress={onClose} />}>
      <View style={styles.body}>
        <Badge label="Checkout arrives in the next build" tone="info" />
        <Text variant="body" color="textMuted">
          Here is what a {formatMoney(EXAMPLE_CENTS)} contribution would do.
        </Text>
        <View style={[styles.table, { borderColor: colors.border }]}>
          {rows.map(([label, value, strong], i) => (
            <View key={label}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <Text variant={strong ? 'bodyStrong' : 'subhead'} color={strong ? 'text' : 'textMuted'}>
                  {label}
                </Text>
                <Text variant={strong ? 'bodyStrong' : 'subhead'} tabular>
                  {value}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text variant="subhead" color="textMuted">
          {`Of your ${formatMoney(EXAMPLE_CENTS)}, ${formatMoney(fees.adBudgetCents, { showCents: true })} buys ads and ${formatMoney(fees.platformFeeCents, { showCents: true })} covers review and reporting.`}
        </Text>
        <View style={styles.reach}>
          <Text variant="caption" color="textMuted">
            Estimated reach of your contribution
          </Text>
          <EstimatedReach amountCents={EXAMPLE_CENTS} variant="bodyStrong" />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: space.md },
  reach: { gap: 2 },
});
