import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EstimatedReach } from '@/components/ui/estimate';
import { FlaskIcon, LockSimpleIcon, WarningCircleIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { demo } from '@/config/demo';
import { computeFees } from '@/domain/money';
import type { Campaign, Cents, SimulatedOutcome, User } from '@/domain/types';
import { formatMoney } from '@/lib/format';
import { duration, radius, space, useTheme } from '@/theme';

import { AmountPicker } from './amount-picker';
import { CampaignStrip } from './campaign-strip';
import { ChargeTable, FundsSplit } from './fee-breakdown';
import { StepLayout } from '@/components/ui/step-layout';

const money = (cents: Cents) => formatMoney(cents, { showCents: true });

export function isValidAmount(cents: Cents) {
  return cents >= demo.funding.minContributionCents && cents <= demo.funding.maxContributionCents;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="overline" color="textMuted" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

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

function InlineLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.97} accessibilityRole="link" hitSlop={8}>
      <Text variant="footnote" color="primary">
        {label}
      </Text>
    </PressableScale>
  );
}

// ── Step 1: amount ────────────────────────────────────────────────────────────

export function AmountStep({
  campaign,
  amountCents,
  onChange,
  onContinue,
}: {
  campaign: Campaign;
  amountCents: Cents;
  onChange: (cents: Cents) => void;
  onContinue: () => void;
}) {
  const valid = isValidAmount(amountCents);
  const tooHigh = amountCents > demo.funding.maxContributionCents;
  const fees = computeFees(valid ? amountCents : 0);

  return (
    <StepLayout
      footer={<Button label="Continue" size="lg" fullWidth disabled={!valid} onPress={onContinue} />}>
      <CampaignStrip campaign={campaign} addCents={valid ? amountCents : 0} />
      <AmountPicker
        amountCents={amountCents}
        onChange={onChange}
        error={tooHigh ? `The most you can give at once is ${formatMoney(demo.funding.maxContributionCents)}` : null}
      />
      <Card tone="sunken" elevation="e0" style={styles.reachCard}>
        <Text variant="caption" color="textMuted">
          {valid ? `Your ${formatMoney(amountCents)} would reach` : 'Choose an amount to see its reach'}
        </Text>
        <EstimatedReach amountCents={valid ? amountCents : 0} variant="title3" animated />
        <Text variant="footnote" color="textMuted">
          {valid
            ? `${money(fees.adBudgetCents)} buys ads after the ${Math.round(demo.fees.platformPct * 100)}% platform fee.`
            : `${Math.round((1 - demo.fees.platformPct) * 100)}% of every contribution buys ads.`}
        </Text>
      </Card>
    </StepLayout>
  );
}

// ── Step 2: review ────────────────────────────────────────────────────────────

export function ReviewStep({
  campaign,
  amountCents,
  user,
  showName,
  onShowNameChange,
  onContinue,
}: {
  campaign: Campaign;
  amountCents: Cents;
  user: User | null;
  showName: boolean;
  onShowNameChange: (value: boolean) => void;
  onContinue: () => void;
}) {
  const { colors } = useTheme();
  const fees = computeFees(amountCents);
  const minimum = formatMoney(demo.funding.minimumToDistributeCents);
  const openInfo = (slug: 'terms' | 'faq') => router.push({ pathname: '/info/[slug]', params: { slug } });

  return (
    <StepLayout footer={<Button label="Continue to payment" size="lg" fullWidth onPress={onContinue} />}>
      <CampaignStrip campaign={campaign} addCents={amountCents} />

      <Group title="You pay">
        <ChargeTable fees={fees} />
      </Group>

      <Group title={`Where your ${formatMoney(amountCents)} goes`}>
        <FundsSplit fees={fees} />
        <View style={styles.reachRow}>
          <Text variant="caption" color="textMuted">
            Estimated reach
          </Text>
          <EstimatedReach amountCents={amountCents} variant="bodyStrong" />
        </View>
      </Group>

      <View style={[styles.callout, { backgroundColor: colors.primarySoft }]}>
        <Text variant="bodyStrong" color="primary">
          Amplification, not a donation
        </Text>
        <Text variant="subhead" color="primary">
          {`Your money pays for ads that spread this message. It isn’t given to ${campaign.creator.name} or the cause.`}
        </Text>
      </View>

      <Group title="If things don’t go to plan">
        <View style={styles.bullets}>
          <Bullet>If the goal isn’t reached, what was raised still runs a smaller campaign.</Bullet>
          <Bullet>{`If less than ${minimum} is raised in total, every backer is refunded in full.`}</Bullet>
          <Bullet>If the ads can’t spend the whole budget, the rest is refunded in proportion to what you gave.</Bullet>
        </View>
      </Group>

      <Card padded={false}>
        <View style={styles.nameRow}>
          <View style={styles.flex}>
            <Text variant="body">Show my name on this campaign</Text>
            <Text variant="footnote" color="textMuted">
              {user
                ? showName
                  ? `Backers list shows “${user.name}”.`
                  : 'Off: you appear as an anonymous backer.'
                : 'Guests always appear as anonymous backers.'}
            </Text>
          </View>
          <Switch
            value={user ? showName : false}
            onValueChange={onShowNameChange}
            disabled={!user}
            accessibilityLabel="Show my name on this campaign"
          />
        </View>
      </Card>

      <View style={styles.fineprint}>
        <Text variant="footnote" color="textMuted">
          By continuing you agree to the
        </Text>
        <InlineLink label="Terms of use" onPress={() => openInfo('terms')} />
        <Text variant="footnote" color="textMuted">
          and
        </Text>
        <InlineLink label="refund policy" onPress={() => openInfo('faq')} />
      </View>
    </StepLayout>
  );
}

// ── Step 3: checkout ──────────────────────────────────────────────────────────

function DemoCard() {
  return (
    <LinearGradient
      colors={['#2B3486', '#121417']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.demoCard}
      accessible
      accessibilityLabel={`Test card ending ${demo.payments.demoCardLast4}`}>
      <View style={styles.chip} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" style={styles.onCard}>
          Test card
        </Text>
        <Text variant="footnote" style={styles.onCardMuted} tabular>
          {`•••• ${demo.payments.demoCardLast4} · Expires 12/29`}
        </Text>
      </View>
      <Badge label="Test" icon={FlaskIcon} />
    </LinearGradient>
  );
}

export function CheckoutStep({
  amountCents,
  user,
  email,
  onEmailChange,
  emailError,
  simulate,
  onSimulateChange,
  error,
  onPay,
  onCancelPayment,
}: {
  amountCents: Cents;
  user: User | null;
  email: string;
  onEmailChange: (email: string) => void;
  emailError?: string | null;
  simulate: SimulatedOutcome;
  onSimulateChange: (value: SimulatedOutcome) => void;
  /** Request-level failure from the last attempt (nothing was charged). */
  error?: { title: string; message: string } | null;
  onPay: () => void;
  onCancelPayment: () => void;
}) {
  const { colors } = useTheme();
  const fees = computeFees(amountCents);

  return (
    <StepLayout
      footer={
        <>
          <View style={styles.totalRow}>
            <Text variant="subhead" color="textMuted">
              Total today
            </Text>
            <Text variant="title3" tabular>
              {money(fees.totalChargeCents)}
            </Text>
          </View>
          <Button label={`Pay ${money(fees.totalChargeCents)}`} size="lg" fullWidth icon={LockSimpleIcon} onPress={onPay} />
          <Button label="Cancel payment" variant="ghost" size="sm" style={styles.center} onPress={onCancelPayment} />
        </>
      }>
      {error && (
        <Animated.View
          entering={FadeIn.duration(duration.base)}
          accessibilityLiveRegion="assertive"
          style={[styles.error, { backgroundColor: colors.dangerSoft }]}>
          <WarningCircleIcon size={18} color={colors.danger} />
          <View style={styles.flex}>
            <Text variant="subhead" color="danger">
              {error.title}
            </Text>
            <Text variant="footnote" color="danger">
              {`${error.message} You weren’t charged.`}
            </Text>
          </View>
        </Animated.View>
      )}

      <Group title="Pay with">
        <DemoCard />
      </Group>

      <Group title="Receipt">
        {user ? (
          <Card style={styles.account}>
            <Avatar name={user.name} size={40} />
            <View style={styles.flex}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {user.name}
              </Text>
              <Text variant="footnote" color="textMuted" numberOfLines={1}>
                {`Receipt goes to ${user.email}`}
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.guest}>
            <TextField
              label="Email"
              required
              value={email}
              onChangeText={onEmailChange}
              error={emailError ?? undefined}
              helper="For your receipt. No account needed."
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="done"
            />
            <View style={styles.signIn}>
              <Text variant="footnote" color="textMuted">
                Have an account?
              </Text>
              <InlineLink
                label="Sign in"
                onPress={() => router.push({ pathname: '/auth', params: { reason: 'payments' } })}
              />
            </View>
          </View>
        )}
      </Group>

      <Card tone="sunken" elevation="e0" style={styles.simulate}>
        <View style={styles.simulateHeader}>
          <Text variant="subhead" style={styles.flex}>
            Test payment result
          </Text>
          <Badge label="Prototype" icon={FlaskIcon} />
        </View>
        <Text variant="footnote" color="textMuted">
          Choose what the test card does. No real money moves.
        </Text>
        <SegmentedControl<SimulatedOutcome>
          accessibilityLabel="Test payment result"
          value={simulate}
          onChange={onSimulateChange}
          options={[
            { value: 'approve', label: 'Approve' },
            { value: 'pending', label: 'Pending' },
            { value: 'decline', label: 'Decline' },
          ]}
        />
      </Card>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignSelf: 'center' },
  group: { gap: space.md },
  reachCard: { gap: space.xs, alignItems: 'flex-start' },
  reachRow: { gap: 2, marginTop: space.xs },
  callout: { padding: space.lg, borderRadius: radius.md, gap: space.xs },
  bullets: { gap: space.sm },
  bullet: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 9 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  fineprint: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, rowGap: 2 },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  chip: { width: 34, height: 26, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.22)' },
  onCard: { color: '#FFFFFF' },
  onCardMuted: { color: 'rgba(255,255,255,0.72)' },
  account: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  guest: { gap: space.md },
  signIn: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  simulate: { gap: space.sm },
  simulateHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  error: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.md },
});
