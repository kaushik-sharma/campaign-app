import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/backing/confetti';
import { PaymentStatusIcon } from '@/components/backing/payment-status-icon';
import { CoverImage } from '@/components/campaign/cover-image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { CheckIcon, FlaskIcon, XIcon } from '@/components/ui/icons';
import { ErrorState } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status-pill';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import type { CampaignStatus } from '@/domain/lifecycle';
import type { Campaign } from '@/domain/types';
import { useDraftForCampaign, useMyCampaign } from '@/features/creator/queries';
import { formatRelative } from '@/lib/format';
import { duration, layout, radius, space, useTheme } from '@/theme';

type StepState = 'done' | 'current' | 'upcoming' | 'stopped';
type TimelineStep = { key: string; label: string; detail: string; state: StepState; at?: string };

function timeline(c: Campaign): TimelineStep[] {
  const lastAt = (s: CampaignStatus) => [...c.history].reverse().find((e) => e.status === s)?.at;
  const decided = ['approved', 'changes-requested', 'rejected', 'funding'].includes(c.status);
  const decision =
    c.status === 'changes-requested'
      ? { label: 'Changes requested', detail: 'Edit and resubmit to continue.', state: 'stopped' as const, at: lastAt('changes-requested') }
      : c.status === 'rejected'
        ? { label: 'Not approved', detail: 'This campaign didn’t meet the campaign rules.', state: 'stopped' as const, at: lastAt('rejected') }
        : { label: 'Approved', detail: 'Passed review.', state: decided ? ('done' as const) : ('upcoming' as const), at: lastAt('approved') };
  return [
    { key: 'submitted', label: 'Submitted', detail: 'Your campaign is with the review team.', state: 'done', at: lastAt('submitted') },
    {
      key: 'review',
      label: 'Under review',
      detail: 'Checking the story against its sources, the visuals and the targeting.',
      state: c.status === 'submitted' ? 'current' : 'done',
    },
    { key: 'decision', ...decision },
    {
      key: 'open',
      label: 'Open for backing',
      detail: `Backers can fund its reach for ${demo.lifecycle.fundingWindowDays} days.`,
      state: c.status === 'funding' ? 'done' : c.status === 'approved' ? 'current' : 'upcoming',
      at: lastAt('funding'),
    },
  ];
}

function Dot({ state }: { state: StepState }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (state === 'current' && !reduced) pulse.set(withRepeat(withTiming(1, { duration: 1400 }), -1));
    else pulse.set(0);
  }, [state, reduced, pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - pulse.get()), transform: [{ scale: 1 + pulse.get() * 1.2 }] }));

  const fill =
    state === 'done' ? colors.success : state === 'current' ? colors.primary : state === 'stopped' ? colors.warning : colors.surface;
  return (
    <View style={styles.dotWrap}>
      {state === 'current' && <Animated.View style={[styles.ring, { backgroundColor: colors.primary }, ring]} />}
      <View style={[styles.dot, { backgroundColor: fill, borderColor: state === 'upcoming' ? colors.borderStrong : fill }]}>
        {state === 'done' && <CheckIcon size={12} color={colors.onPrimary} weight="bold" />}
      </View>
    </View>
  );
}

function Timeline({ steps }: { steps: TimelineStep[] }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="list">
      {steps.map((s, i) => (
        <Animated.View key={`${s.key}-${s.state}`} entering={FadeIn.duration(duration.base)} style={styles.step} accessible accessibilityLabel={`${s.label}. ${s.state === 'current' ? 'In progress. ' : s.state === 'upcoming' ? 'Not yet. ' : ''}${s.detail}`}>
          <View style={styles.rail}>
            <Dot state={s.state} />
            {i < steps.length - 1 && <View style={[styles.line, { backgroundColor: s.state === 'done' ? colors.success : colors.border }]} />}
          </View>
          <View style={styles.stepText}>
            <View style={styles.stepTitle}>
              <Text variant="bodyStrong" color={s.state === 'upcoming' ? 'textMuted' : 'text'} style={styles.flex}>
                {s.label}
              </Text>
              {s.at && (
                <Text variant="caption" color="textMuted">
                  {formatRelative(s.at)}
                </Text>
              )}
            </View>
            <Text variant="footnote" color="textMuted">
              {s.detail}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/**
 * After submitting (and from Activity): the review status of one of my campaigns, updating live
 * as the lifecycle simulator moves it along.
 */
export default function SubmittedScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useMyCampaign(id);
  const c = query.data;
  const changes = c?.status === 'changes-requested';
  const draftFor = useDraftForCampaign(id, changes);
  const note = c?.history.at(-1)?.note;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <Text variant="title3" style={styles.flex}>
          Review status
        </Text>
        <IconButton icon={XIcon} accessibilityLabel="Close" variant="tinted" size={32} onPress={() => router.back()} />
      </View>

      {!c ? (
        <View style={styles.center}>
          {query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} /> : <ActivityIndicator />}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}>
          {fresh && (
            <View style={styles.hero}>
              <View>
                <PaymentStatusIcon state="succeeded" />
                <Confetti fire delay={duration.slow + 160} />
              </View>
              <Animated.View entering={FadeInDown.delay(450).duration(duration.slow)} style={styles.heroText}>
                <Text variant="title1" align="center" accessibilityRole="header">
                  Submitted for review
                </Text>
                <Text variant="body" color="textMuted" align="center">
                  We’ll check your story, sources, visuals and targeting. You’ll hear back in Activity.
                </Text>
              </Animated.View>
            </View>
          )}

          <Animated.View entering={FadeInDown.delay(fresh ? 600 : 0).duration(duration.slow)}>
            <Card style={styles.card}>
              <View style={styles.campaign}>
                <CoverImage image={c.cover} category={c.category} style={styles.thumb} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {c.title}
                  </Text>
                  <View style={styles.pill}>
                    <StatusPill status={c.status} />
                  </View>
                </View>
              </View>
              <Timeline steps={timeline(c)} />
            </Card>
          </Animated.View>

          {changes && (
            <Card tone="sunken" elevation="e0" style={styles.card}>
              <Text variant="bodyStrong">What the reviewers asked for</Text>
              <Text variant="subhead" color="textMuted">
                {note ?? 'Review the feedback, edit and resubmit.'}
              </Text>
              <Button
                label="Edit and resubmit"
                loading={draftFor.isPending}
                disabled={!draftFor.data}
                onPress={() => draftFor.data && router.push({ pathname: '/draft/[id]', params: { id: draftFor.data, resubmit: '1' } })}
              />
            </Card>
          )}

          {c.status === 'funding' && (
            <Button label="View live campaign" size="lg" fullWidth onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: c.id } })} />
          )}

          {(c.status === 'submitted' || c.status === 'approved') && (
            <View style={[styles.demo, { backgroundColor: colors.surfaceSunken }]}>
              <FlaskIcon size={16} color={colors.textMuted} />
              <Text variant="footnote" color="textMuted" style={styles.flex}>
                {`Review decides after about ${demo.lifecycle.reviewDecisionSec} seconds and backing opens ${
                  demo.lifecycle.openForFundingSec - demo.lifecycle.reviewDecisionSec
                } seconds later. You can also step it forward in Profile → Developer controls.`}
              </Text>
            </View>
          )}

          <Button label="Done" variant="secondary" fullWidth onPress={() => router.back()} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter, paddingBottom: space.sm },
  content: { paddingHorizontal: layout.gutter, paddingTop: space.lg, gap: space.xl },
  hero: { alignItems: 'center', gap: space.xl, paddingVertical: space.lg },
  heroText: { gap: space.sm },
  card: { gap: space.lg },
  campaign: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  pill: { flexDirection: 'row', marginTop: space.xs },
  step: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: 22 },
  dotWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 2, borderRadius: 1 },
  stepText: { flex: 1, gap: 2, paddingBottom: space.xl },
  stepTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  demo: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
});
