import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { EstimatedReach } from '@/components/ui/estimate';
import { ReceiptIcon, ShareNetworkIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';
import { fundingProgress } from '@/domain/money';
import type { Campaign, Contribution } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { shareCampaign } from '@/lib/share';
import { duration, space } from '@/theme';

import { Confetti } from './confetti';
import { PaymentStatusIcon } from './payment-status-icon';
import { StepLayout } from './step-layout';

const money = (cents: number) => formatMoney(cents, { showCents: true });
const enter = (i: number) => FadeInDown.delay(500 + i * 80).duration(duration.slow);

type Props = {
  campaign: Campaign;
  /** null while the payment is processing. */
  contribution: Contribution | null;
  processingLabel: string;
  onTryAgain: () => void;
  onChangeAmount: () => void;
  onReturnToPayment: () => void;
};

const COPY = {
  succeeded: { title: 'You’re backing this campaign' },
  pending: { title: 'Payment processing' },
  failed: { title: 'Payment declined' },
  cancelled: { title: 'Payment cancelled' },
} as const;

/** Processing, then one of the four outcomes, each with the next action that makes sense. */
export function ResultStep({ campaign, contribution, processingLabel, onTryAgain, onChangeAmount, onReturnToPayment }: Props) {
  const close = () => router.back();
  const viewReceipt = (id: string) => {
    router.back();
    router.push({ pathname: '/receipt/[id]', params: { id } });
  };

  const c = contribution;
  if (!c) {
    // Same layout and icon instance as the outcome, so the spinner morphs in place.
    return (
      <StepLayout>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <PaymentStatusIcon state="processing" />
            <Confetti fire={false} />
          </View>
          <Animated.View key="processing" entering={FadeIn.duration(duration.base)} style={styles.copy}>
            <Text variant="title2" align="center">
              {processingLabel}
            </Text>
            <Text variant="subhead" color="textMuted" align="center">
              Keep this screen open. It only takes a moment.
            </Text>
          </Animated.View>
        </View>
      </StepLayout>
    );
  }
  const amount = formatMoney(c.amountCents);

  const footer = {
    succeeded: (
      <>
        <Button label="Done" size="lg" fullWidth onPress={close} />
        <View style={styles.row}>
          <Button label="Receipt" variant="secondary" icon={ReceiptIcon} style={styles.flex} onPress={() => viewReceipt(c.id)} />
          <Button
            label="Share"
            variant="secondary"
            icon={ShareNetworkIcon}
            style={styles.flex}
            onPress={() => void shareCampaign(campaign)}
          />
        </View>
      </>
    ),
    pending: (
      <>
        <Button label="Done" size="lg" fullWidth onPress={close} />
        <Button label="View receipt" variant="secondary" icon={ReceiptIcon} fullWidth onPress={() => viewReceipt(c.id)} />
      </>
    ),
    failed: (
      <>
        <Button label="Try again" size="lg" fullWidth onPress={onTryAgain} />
        <View style={styles.row}>
          <Button label="Change amount" variant="secondary" style={styles.flex} onPress={onChangeAmount} />
          <Button label="Close" variant="secondary" style={styles.flex} onPress={close} />
        </View>
      </>
    ),
    cancelled: (
      <>
        <Button label="Return to payment" size="lg" fullWidth onPress={onReturnToPayment} />
        <Button label="Close" variant="ghost" style={styles.center} onPress={close} />
      </>
    ),
  }[c.status];

  const message = {
    succeeded: `Thank you. Your ${amount} now counts toward the goal and will pay for ads that spread this message.`,
    pending: 'Your bank is confirming this payment. It usually takes a few seconds. Funding totals change only once it’s confirmed, and Activity will tell you when it is.',
    failed: `${c.failureReason ?? 'The payment didn’t go through.'} You haven’t been charged. Try again, or choose a different amount.`,
    cancelled: 'You weren’t charged. Your amount and choices are still here if you want to finish.',
  }[c.status];

  return (
    <StepLayout footer={<Animated.View entering={FadeIn.delay(400).duration(duration.base)} style={styles.footer}>{footer}</Animated.View>}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <PaymentStatusIcon state={c.status} />
          <Confetti fire={c.status === 'succeeded'} delay={duration.slow + 160} />
        </View>
        <Animated.View key={c.status} entering={enter(0)} style={styles.copy}>
          <Text variant="title1" align="center" accessibilityRole="header">
            {COPY[c.status].title}
          </Text>
          <Text variant="body" color="textMuted" align="center">
            {message}
          </Text>
        </Animated.View>
      </View>

      {c.status === 'succeeded' && c.funding && (
        <Animated.View entering={enter(1)}>
          <Card style={styles.card}>
            <View style={styles.amounts}>
              <AnimatedNumber value={c.funding.afterCents} from={c.funding.beforeCents} delay={900} format="money" variant="amount" />
              <Text variant="subhead" color="textMuted">
                {`raised of ${formatMoney(c.funding.goalCents)} goal`}
              </Text>
            </View>
            <ProgressBar
              value={fundingProgress(c.funding.afterCents, c.funding.goalCents)}
              from={fundingProgress(c.funding.beforeCents, c.funding.goalCents)}
              delay={900}
              height={8}
              accessibilityLabel={`${formatPercent(fundingProgress(c.funding.afterCents, c.funding.goalCents))} funded`}
            />
            <Text variant="footnote" color="primary" tabular>
              {`+${amount} from you · now ${formatPercent(fundingProgress(c.funding.afterCents, c.funding.goalCents))} funded`}
            </Text>
            <Divider />
            <View style={styles.reach}>
              <Text variant="caption" color="textMuted">
                Your contribution reaches
              </Text>
              <EstimatedReach amountCents={c.amountCents} variant="bodyStrong" />
            </View>
            <Divider />
            <Text variant="footnote" color="textMuted">
              {`Receipt ${c.receiptNumber} sent to ${c.email}`}
            </Text>
          </Card>
        </Animated.View>
      )}

      {c.status === 'pending' && (
        <Animated.View entering={enter(1)}>
          <Card style={styles.card}>
            <View style={styles.pendingRow}>
              <ActivityIndicator />
              <Text variant="subhead" style={styles.flex}>
                Waiting for your bank…
              </Text>
            </View>
            <Divider />
            <Text variant="footnote" color="textMuted">
              {`${money(c.totalChargeCents)} authorised · Receipt ${c.receiptNumber}`}
            </Text>
          </Card>
        </Animated.View>
      )}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignSelf: 'auto' },
  center: { alignSelf: 'center' },
  row: { flexDirection: 'row', gap: space.sm },
  footer: { gap: space.sm },
  hero: { alignItems: 'center', gap: space.xl, paddingTop: space['3xl'] },
  copy: { gap: space.sm, alignItems: 'center' },
  iconWrap: { zIndex: 1 },
  card: { gap: space.md },
  amounts: { gap: 2 },
  reach: { gap: 2 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
