import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import type { CampaignStatus } from '@/domain/lifecycle';
import type { Campaign } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { duration, easing, space, useTheme } from '@/theme';

type State = 'done' | 'current' | 'upcoming' | 'stopped';
type Step = { key: string; label: string; detail: string; state: State; at?: string };

/** Position of each status along the main path. */
const ORDER: Partial<Record<CampaignStatus, number>> = {
  submitted: 0,
  'changes-requested': 1,
  rejected: 1,
  approved: 2,
  funding: 3,
  'goal-reached': 4,
  'funding-ended': 4,
  'refund-pending': 5,
  'distribution-prep': 5,
  promoting: 6,
  completed: 7,
};

function steps(c: Campaign): Step[] {
  const at = (...statuses: CampaignStatus[]) => [...c.history].reverse().find((e) => statuses.includes(e.status))?.at;
  const pos = ORDER[c.status] ?? 0;
  const stoppedInReview = c.status === 'changes-requested' || c.status === 'rejected';
  const refunded = c.status === 'refund-pending';
  const closedShort = c.status === 'funding-ended' || refunded || (pos >= 4 && c.raisedCents < c.goalCents);
  const enough = c.raisedCents >= demo.funding.minimumToDistributeCents;
  /** done once the campaign is past `doneAt`, current while it's at one of `currentAt`. */
  const stage = (doneAt: number, currentAt: number[]): State => (pos >= doneAt ? 'done' : currentAt.includes(pos) ? 'current' : 'upcoming');

  return [
    { key: 'submitted', label: 'Submitted', detail: 'Sent for review.', state: 'done', at: at('submitted') },
    {
      key: 'review',
      label: stoppedInReview ? (c.status === 'rejected' ? 'Not approved' : 'Changes requested') : 'Review',
      detail: stoppedInReview ? 'See the reviewers’ note below.' : 'Story, sources, visuals and targeting checked.',
      state: stoppedInReview ? 'stopped' : stage(2, [0]),
      at: at('approved', 'changes-requested', 'rejected'),
    },
    {
      key: 'open',
      label: 'Open for backing',
      detail: `Backers can fund it for ${demo.lifecycle.fundingWindowDays} days.`,
      state: stoppedInReview ? 'upcoming' : stage(3, [2]),
      at: at('funding'),
    },
    {
      key: 'closed',
      label: closedShort ? 'Funding closed' : 'Goal reached',
      detail: closedShort ? (enough ? 'Below goal: a smaller ad run goes ahead.' : 'Under the minimum: backers are refunded.') : 'Fully funded.',
      state: stage(4, [3]),
      at: at('goal-reached', 'funding-ended'),
    },
    {
      key: 'setup',
      label: refunded ? 'Refunded' : 'Ads set up',
      detail: refunded ? 'Every backer gets a full refund.' : 'Ads prepared and approved with distribution partners.',
      state: refunded ? 'stopped' : stage(6, [4, 5]),
      at: at('distribution-prep', 'refund-pending'),
    },
    { key: 'live', label: 'Ads live', detail: `A ${c.durationDays}-day run across the chosen channels.`, state: refunded ? 'upcoming' : stage(7, [6]), at: at('promoting') },
    { key: 'done', label: 'Completed', detail: 'Final report with delivery and spend.', state: refunded ? 'upcoming' : stage(7, []), at: at('completed') },
  ];
}

function Dot({ state }: { state: State }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(state === 'current' && !reduced ? withRepeat(withTiming(1, { duration: 1400 }), -1) : 0);
  }, [state, reduced, pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - pulse.get()), transform: [{ scale: 1 + pulse.get() * 1.1 }] }));
  const fill = state === 'done' ? colors.success : state === 'current' ? colors.primary : state === 'stopped' ? colors.warning : colors.surface;
  return (
    <View style={styles.dotWrap}>
      {state === 'current' && <Animated.View style={[styles.ring, { backgroundColor: colors.primary }, ring]} />}
      <View style={[styles.dot, { backgroundColor: fill, borderColor: state === 'upcoming' ? colors.borderStrong : fill }]}>
        {state === 'done' && <CheckIcon size={11} color={colors.onPrimary} weight="bold" />}
      </View>
    </View>
  );
}

/** The connector below a step fills top to bottom, one after another, as the timeline appears. */
function Connector({ filled, index }: { filled: boolean; index: number }) {
  const { colors } = useTheme();
  const height = useSharedValue(0);
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.set(withDelay(150 + index * 110, withTiming(filled ? 1 : 0, { duration: duration.base, easing: easing.standard })));
  }, [filled, index, fill]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -height.get() * (1 - fill.get()) }] }));
  return (
    <View onLayout={(e) => height.set(e.nativeEvent.layout.height)} style={[styles.line, { backgroundColor: colors.border }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.success }, style]} />
    </View>
  );
}

/** Every stage from submission to the final report, with dates for the ones reached. */
export function LifecycleTimeline({ campaign }: { campaign: Campaign }) {
  const list = steps(campaign);
  return (
    <View accessibilityRole="list">
      {list.map((s, i) => (
        <View
          key={s.key}
          style={styles.step}
          accessible
          accessibilityLabel={`${s.label}. ${s.state === 'done' ? 'Done' : s.state === 'current' ? 'In progress' : s.state === 'stopped' ? 'Stopped' : 'Not yet'}. ${s.detail}`}>
          <View style={styles.rail}>
            <Dot state={s.state} />
            {i < list.length - 1 && <Connector index={i} filled={s.state === 'done'} />}
          </View>
          <View style={styles.text}>
            <View style={styles.titleRow}>
              <Text variant="subhead" color={s.state === 'upcoming' ? 'textMuted' : 'text'} style={styles.flex}>
                {s.label}
              </Text>
              {s.at && s.state !== 'upcoming' && (
                <Text variant="caption" color="textMuted">
                  {formatDate(s.at)}
                </Text>
              )}
            </View>
            <Text variant="footnote" color="textMuted">
              {s.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  step: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: 20 },
  dotWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 20, height: 20, borderRadius: 10 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 2, borderRadius: 1, overflow: 'hidden' },
  text: { flex: 1, gap: 2, paddingBottom: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
