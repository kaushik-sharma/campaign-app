import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ResultStep } from '@/components/backing/result-step';
import { AmountStep, CheckoutStep, ReviewStep } from '@/components/backing/steps';
import { IconButton } from '@/components/ui/icon-button';
import { ArrowLeftIcon, HandshakeIcon, XIcon } from '@/components/ui/icons';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { acceptsContributions, statusMeta } from '@/domain/lifecycle';
import type { Cents, SimulatedOutcome } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { useCampaign } from '@/features/campaigns/queries';
import { useCheckout, useContribution } from '@/features/contributions/queries';
import { haptics } from '@/lib/haptics';
import { describeError, isServiceError } from '@/services';
import { usePreferences } from '@/stores/preferences';
import { duration, easing, radius, space, useTheme } from '@/theme';

type Step = 'amount' | 'review' | 'checkout' | 'result';
const STEPS: Step[] = ['amount', 'review', 'checkout'];
const ORDER: Step[] = [...STEPS, 'result'];
const STEP_LABELS: Record<Step, string> = {
  amount: 'Amount',
  review: 'Review',
  checkout: 'Payment',
  result: '',
};

/** Processing is held on screen at least this long so the morph reads as a real payment. */
const MIN_PROCESSING_MS = 1400;

const emailSchema = z.email();
const newKey = () => `ck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function StepBar({ index }: { index: number }) {
  return (
    <View style={styles.stepBar} accessibilityRole="progressbar" accessibilityLabel={`Step ${index + 1} of ${STEPS.length}`}>
      {STEPS.map((step, i) => (
        <StepSegment key={step} active={i <= index} />
      ))}
    </View>
  );
}

function StepSegment({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const fill = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    fill.set(withTiming(active ? 1 : 0, { duration: duration.slow, easing: easing.standard }));
  }, [active, fill]);
  const style = useAnimatedStyle(() => ({
    opacity: width.get() > 0 ? 1 : 0,
    transform: [{ translateX: -width.get() * (1 - fill.get()) }],
  }));
  return (
    <View
      onLayout={(e) => width.set(e.nativeEvent.layout.width)}
      style={[styles.segment, { backgroundColor: colors.surfaceSunken }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: colors.primary }, style]} />
    </View>
  );
}

/**
 * Backing flow: amount → review → payment → result. Steps slide in the direction of travel;
 * Back (header, Android back button) returns to the previous step with everything kept.
 * Guests are only asked for an email.
 */
export default function BackCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const query = useCampaign(id);
  const campaign = query.data;
  const checkout = useCheckout();

  // Step and slide direction change together, derived from the latest step (not a stale closure).
  const [{ step, direction }, setNav] = useState<{ step: Step; direction: 1 | -1 }>({ step: 'amount', direction: 1 });
  const [amountCents, setAmountCents] = useState<Cents>(demo.funding.defaultAmountCents);
  const [showName, setShowName] = useState(() => usePreferences.getState().showNameWhenBacking);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [simulate, setSimulate] = useState<SimulatedOutcome>('approve');
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [payError, setPayError] = useState<{ title: string; message: string } | null>(null);
  const [contributionId, setContributionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const contribution = useContribution(contributionId, { poll: true }).data ?? null;
  const processing = step === 'result' && !contribution;
  const stepIndex = STEPS.indexOf(step);

  const go = (next: Step) =>
    setNav((current) => ({
      step: next,
      direction: ORDER.indexOf(next) >= ORDER.indexOf(current.step) ? 1 : -1,
    }));

  const goBack = () => {
    if (step === 'review') go('amount');
    else if (step === 'checkout') go('review');
  };

  // Android back steps backwards through the flow and is ignored while a payment is processing.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (processing) return true;
      if (step === 'review' || step === 'checkout') {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });

  const pay = async (outcome: SimulatedOutcome | 'cancel') => {
    if (!campaign) return;
    if (!user && outcome !== 'cancel') {
      const ok = emailSchema.safeParse(email.trim()).success;
      setEmailError(ok ? null : 'Enter a valid email for your receipt');
      if (!ok) return;
    }
    setPayError(null);
    setCancelling(outcome === 'cancel');
    setContributionId(null);
    go('result');
    try {
      const [result] = await Promise.all([
        checkout.mutateAsync({
          campaignId: campaign.id,
          amountCents,
          email: user ? undefined : email.trim() || undefined,
          showName: !!user && showName,
          idempotencyKey,
          simulate: outcome,
        }),
        wait(outcome === 'cancel' ? 0 : MIN_PROCESSING_MS),
      ]);
      setContributionId(result.id);
    } catch (e) {
      // The request never completed, so nothing was charged; the same key makes a retry safe.
      haptics.error();
      if (isServiceError(e) && e.fieldErrors?.email) setEmailError(e.fieldErrors.email);
      const { title, message } = describeError(e);
      setPayError({ title, message: isServiceError(e) && e.code === 'conflict' ? e.message : message });
      go('checkout');
    }
  };

  const restartPayment = (to: Step) => {
    setIdempotencyKey(newKey());
    setContributionId(null);
    setSimulate('approve');
    go(to);
  };

  let body: React.ReactNode;
  if (!campaign) {
    body = query.isError ? (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
    ) : (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  } else if (!acceptsContributions(campaign.status) && step !== 'result') {
    body = (
      <EmptyState
        icon={HandshakeIcon}
        title="Not accepting contributions"
        message={`This campaign is ${statusMeta[campaign.status].label.toLowerCase()}. ${statusMeta[campaign.status].next}`}
        action={{ label: 'Close', onPress: () => router.back() }}
      />
    );
  } else {
    const entering = (direction > 0 ? FadeInRight : FadeInLeft).duration(duration.slow).easing(easing.enter);
    const exiting = (direction > 0 ? FadeOutLeft : FadeOutRight).duration(duration.base).easing(easing.exit);
    body = (
      <Animated.View key={step} entering={entering} exiting={exiting} style={StyleSheet.absoluteFill}>
        {step === 'amount' && (
          <AmountStep campaign={campaign} amountCents={amountCents} onChange={setAmountCents} onContinue={() => go('review')} />
        )}
        {step === 'review' && (
          <ReviewStep
            campaign={campaign}
            amountCents={amountCents}
            user={user}
            showName={showName}
            onShowNameChange={setShowName}
            onContinue={() => go('checkout')}
          />
        )}
        {step === 'checkout' && (
          <CheckoutStep
            amountCents={amountCents}
            user={user}
            email={email}
            onEmailChange={(value) => {
              setEmail(value);
              if (emailError) setEmailError(null);
            }}
            emailError={emailError}
            simulate={simulate}
            onSimulateChange={setSimulate}
            error={payError}
            onPay={() => void pay(simulate)}
            onCancelPayment={() => void pay('cancel')}
          />
        )}
        {step === 'result' && (
          <ResultStep
            campaign={campaign}
            contribution={contribution}
            processingLabel={cancelling ? 'Cancelling payment' : 'Processing payment'}
            onTryAgain={() => restartPayment('checkout')}
            onChangeAmount={() => restartPayment('amount')}
            onReturnToPayment={() => restartPayment('checkout')}
          />
        )}
      </Animated.View>
    );
  }

  const showBack = step === 'review' || step === 'checkout';
  const inFlow = stepIndex >= 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* No swipe-to-dismiss while a payment is in flight. */}
      <Stack.Screen options={{ gestureEnabled: !processing }} />
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: insets.top + space.sm }]}>
        <View style={styles.side}>
          {showBack && <IconButton icon={ArrowLeftIcon} accessibilityLabel="Previous step" variant="tinted" size={36} onPress={goBack} />}
        </View>
        <View style={styles.titles}>
          <Text variant="title3" align="center" numberOfLines={1}>
            Back this campaign
          </Text>
          {inFlow && (
            <Text variant="caption" color="textMuted" align="center">
              {`Step ${stepIndex + 1} of ${STEPS.length} · ${STEP_LABELS[step]}`}
            </Text>
          )}
        </View>
        <View style={[styles.side, styles.right]}>
          <IconButton
            icon={XIcon}
            accessibilityLabel="Close"
            variant="tinted"
            size={36}
            disabled={processing}
            onPress={() => router.back()}
          />
        </View>
      </View>
      {inFlow ? <StepBar index={stepIndex} /> : <View style={styles.stepBarSpacer} />}
      <View style={styles.body}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
    gap: space.sm,
  },
  side: { width: 44 },
  right: { alignItems: 'flex-end' },
  titles: { flex: 1, gap: 2 },
  stepBar: { flexDirection: 'row', gap: space.xs, paddingHorizontal: space.xl },
  stepBarSpacer: { height: 4 },
  segment: { flex: 1, height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  segmentFill: { ...StyleSheet.absoluteFill, borderRadius: radius.pill },
  body: { flex: 1, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
