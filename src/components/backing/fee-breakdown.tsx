import { StyleSheet, View } from 'react-native';

import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import type { FeeBreakdown } from '@/domain/money';
import { formatMoney } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

const money = (cents: number) => formatMoney(cents, { showCents: true });

/** What the backer is charged. Used on review and on the receipt so the figures always match. */
export function ChargeTable({ fees, totalLabel = 'Total today' }: { fees: FeeBreakdown; totalLabel?: string }) {
  const { colors } = useTheme();
  const processing = `Card processing (${(demo.fees.processingPct * 100).toFixed(1)}% + ${money(demo.fees.processingFixedCents)})`;
  const rows: [string, string, boolean][] = [
    ['Your contribution', money(fees.contributionCents), false],
    [processing, money(fees.processingFeeCents), false],
    [totalLabel, money(fees.totalChargeCents), true],
  ];
  return (
    <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {rows.map(([label, value, strong], i) => (
        <View key={label}>
          {i > 0 && <Divider />}
          <View style={styles.row}>
            <Text variant={strong ? 'bodyStrong' : 'subhead'} color={strong ? 'text' : 'textMuted'} style={styles.label}>
              {label}
            </Text>
            <Text variant={strong ? 'bodyStrong' : 'subhead'} tabular>
              {value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** How the contribution itself is split between ad budget and the platform fee. */
export function FundsSplit({ fees }: { fees: FeeBreakdown }) {
  const { colors } = useTheme();
  const adPct = Math.round((1 - demo.fees.platformPct) * 100);
  return (
    <View style={styles.split}>
      <View
        style={styles.bar}
        accessible
        accessibilityLabel={`${money(fees.adBudgetCents)} buys ads, ${money(fees.platformFeeCents)} platform fee`}>
        <View style={[styles.segment, { flex: adPct, backgroundColor: colors.primary }]} />
        <View style={[styles.segment, { flex: 100 - adPct, backgroundColor: colors.borderStrong }]} />
      </View>
      <View style={styles.legend} importantForAccessibility="no-hide-descendants">
        <LegendItem color={colors.primary} label="Buys ads" value={money(fees.adBudgetCents)} />
        <LegendItem color={colors.borderStrong} label="Platform fee" value={money(fees.platformFeeCents)} align="right" />
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
  value,
  align = 'left',
}: {
  color: string;
  label: string;
  value: string;
  align?: 'left' | 'right';
}) {
  return (
    <View style={[styles.legendItem, align === 'right' && styles.right]}>
      <View style={styles.legendLabel}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      </View>
      <Text variant="subhead" tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, padding: space.md },
  label: { flex: 1 },
  split: { gap: space.sm },
  bar: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  segment: { height: '100%' },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { gap: 2 },
  right: { alignItems: 'flex-end' },
  legendLabel: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  swatch: { width: 8, height: 8, borderRadius: 2 },
});
