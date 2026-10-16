import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { demo } from '@/config/demo';
import { estimateReach, peoplePerDollar } from '@/domain/money';
import type { Cents } from '@/domain/types';
import { formatMoney, formatReachRange, roundEstimate } from '@/lib/format';
import { radius, space, useTheme, type TypeVariant } from '@/theme';

import { AnimatedNumber } from './animated-number';
import { Badge } from './badge';
import { Divider } from './divider';
import { FlaskIcon, InfoIcon } from './icons';
import { PressableScale } from './pressable-scale';
import { Sheet } from './sheet';
import { Text } from './text';

/** Explains exactly how reach estimates are produced. Opened from every estimate in the app. */
export function ReachAssumptionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const example = estimateReach(10_000);
  const rows: [string, string][] = [
    ['Assumed cost per 1,000 ad views', `$${demo.reach.assumedCpmUsd}`],
    ['Assumed views per person', `${demo.reach.avgFrequency}×`],
    ['Platform fee (not spent on ads)', `${Math.round(demo.fees.platformPct * 100)}%`],
    ['Range shown', `±${Math.round(demo.reach.spread * 100)}%`],
  ];

  return (
    <Sheet open={open} onClose={onClose} title="How reach is estimated" subtitle="An estimate, not a guarantee">
      <View style={styles.sheetBody}>
        <Text variant="body" color="textMuted">
          {`Each $1 of ad budget reaches about ${Math.round(peoplePerDollar())} people with our demo assumptions. A $100 contribution puts $${(
            (100 * (1 - demo.fees.platformPct))
          ).toFixed(0)} into ads, reaching roughly ${formatReachRange(example)} people.`}
        </Text>
        <View style={[styles.table, { borderColor: colors.border }]}>
          {rows.map(([label, value], i) => (
            <View key={label}>
              {i > 0 && <Divider />}
              <View style={styles.row}>
                <Text variant="subhead" color="textMuted" style={styles.rowLabel}>
                  {label}
                </Text>
                <Text variant="subhead" tabular>
                  {value}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text variant="footnote" color="textMuted">
          Actual reach depends on ad inventory, prices, targeting, delivery and performance. Verified
          delivery figures appear in the campaign report once ads run.
        </Text>
        <Badge label="Demo assumptions" icon={FlaskIcon} />
      </View>
    </Sheet>
  );
}

type Props = {
  /** Contribution or goal in cents; reach is derived from the ad-budget share. */
  amountCents: Cents;
  variant?: TypeVariant;
  /** e.g. "people at goal". */
  suffix?: string;
  /** Recount the range when the amount changes (amount pickers). */
  animated?: boolean;
};

/**
 * Every reach figure in the app renders through this: "≈" + range + "Est." badge, and tapping
 * opens the assumptions. Estimates never appear as bare numbers.
 */
export function EstimatedReach({ amountCents, variant = 'subhead', suffix = 'people', animated = false }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const range = estimateReach(amountCents);
  const rangeText = formatReachRange(range);
  const label = `≈ ${rangeText} ${suffix}`;

  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        haptic="selection"
        scaleTo={0.97}
        accessibilityLabel={`Estimated reach: about ${rangeText.replace('–', ' to ')} ${suffix}, for ${formatMoney(amountCents)}.`}
        accessibilityHint="Explains how this estimate is calculated"
        style={styles.inline}>
        {animated ? (
          <View style={styles.numbers} importantForAccessibility="no-hide-descendants">
            <Text variant={variant}>≈ </Text>
            <AnimatedNumber value={roundEstimate(range.low)} format="compact" variant={variant} animateOnMount={false} inline />
            <Text variant={variant}>–</Text>
            <AnimatedNumber value={roundEstimate(range.high)} format="compact" variant={variant} animateOnMount={false} inline />
            <Text variant={variant}>{` ${suffix}`}</Text>
          </View>
        ) : (
          <Text variant={variant} tabular>
            {label}
          </Text>
        )}
        <View style={[styles.estTag, { borderColor: colors.borderStrong }]}>
          <Text variant="caption" color="textMuted" maxFontSizeMultiplier={1.2}>
            Est.
          </Text>
          <InfoIcon size={12} color={colors.textMuted} />
        </View>
      </PressableScale>
      <ReachAssumptionsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Marks seeded figures so nobody mistakes demo data for real activity. */
export function DemoBadge({ label = 'Demo data' }: { label?: string }) {
  return <Badge label={label} icon={FlaskIcon} />;
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, alignSelf: 'flex-start' },
  numbers: { flexDirection: 'row', alignItems: 'center' },
  estTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetBody: { gap: space.lg },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  rowLabel: { flex: 1 },
});
