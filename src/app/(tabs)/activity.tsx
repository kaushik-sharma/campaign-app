import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import {
  BellIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  ClockIcon,
  MinusCircleIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  RocketLaunchIcon,
  SealCheckIcon,
  XCircleIcon,
  type IconComponent,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text, type TextColor } from '@/components/ui/text';
import type { ActivityEvent, ActivityKind } from '@/domain/types';
import { activityKeys, useActivity, useMarkActivityRead } from '@/features/activity/queries';
import { formatRelative } from '@/lib/format';
import { layout, motion, radius, space, spring, useTheme, type ColorTokens } from '@/theme';

const KIND: Record<ActivityKind, { icon: IconComponent; tone: TextColor }> = {
  'payment-succeeded': { icon: CheckCircleIcon, tone: 'success' },
  'payment-pending': { icon: ClockIcon, tone: 'warning' },
  'payment-failed': { icon: XCircleIcon, tone: 'danger' },
  'payment-cancelled': { icon: MinusCircleIcon, tone: 'textMuted' },
  milestone: { icon: ChartLineUpIcon, tone: 'primary' },
  'goal-reached': { icon: SealCheckIcon, tone: 'success' },
  submitted: { icon: PaperPlaneTiltIcon, tone: 'primary' },
  approved: { icon: CheckCircleIcon, tone: 'success' },
  'changes-requested': { icon: PencilSimpleIcon, tone: 'warning' },
  rejected: { icon: XCircleIcon, tone: 'danger' },
  'funding-open': { icon: RocketLaunchIcon, tone: 'success' },
};

function softOf(tone: TextColor, colors: ColorTokens) {
  switch (tone) {
    case 'success':
      return colors.successSoft;
    case 'warning':
      return colors.warningSoft;
    case 'danger':
      return colors.dangerSoft;
    case 'primary':
      return colors.primarySoft;
    default:
      return colors.surfaceSunken;
  }
}

function EventRow({ event }: { event: ActivityEvent }) {
  const { colors } = useTheme();
  const { icon: Icon, tone } = KIND[event.kind];
  const open = () => {
    if (event.contributionId) router.push({ pathname: '/receipt/[id]', params: { id: event.contributionId } });
    else if (event.opensStatus) router.push({ pathname: '/submitted/[id]', params: { id: event.campaignId } });
    else router.push({ pathname: '/campaign/[id]', params: { id: event.campaignId } });
  };

  return (
    <PressableScale
      onPress={open}
      scaleTo={motion.pressScale.row}
      accessibilityLabel={`${event.read ? '' : 'New. '}${event.title}. ${event.body}. ${formatRelative(event.at)}`}
      accessibilityHint={event.contributionId ? 'Opens the receipt' : event.opensStatus ? 'Opens the review status' : 'Opens the campaign'}
      style={styles.row}>
      <View style={[styles.icon, { backgroundColor: softOf(tone, colors) }]}>
        <Icon size={20} color={colors[tone]} weight="fill" />
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" style={styles.flex} numberOfLines={2}>
            {event.title}
          </Text>
          {!event.read && <View style={[styles.unread, { backgroundColor: colors.primary }]} />}
        </View>
        <Text variant="subhead" color="textMuted">
          {event.body}
        </Text>
        <Text variant="caption" color="textMuted">
          {formatRelative(event.at)}
        </Text>
      </View>
    </PressableScale>
  );
}

/**
 * Activity: payment outcomes and funding milestones for campaigns you back or follow. Items are
 * marked read when you leave the tab, so new ones stay highlighted while you look at them.
 */
export default function ActivityScreen() {
  const queryClient = useQueryClient();
  const query = useActivity();
  const markRead = useMarkActivityRead();
  const [refreshing, setRefreshing] = useState(false);
  const events = query.data ?? [];
  const { refetch } = query;
  const { mutate: markAllRead } = markRead;

  useFocusEffect(
    useCallback(() => {
      void refetch();
      return () => {
        const latest = queryClient.getQueryData<ActivityEvent[]>(activityKeys.list());
        if (latest?.some((e) => !e.read)) markAllRead();
      };
    }, [refetch, markAllRead, queryClient]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: activityKeys.list() });
    setRefreshing(false);
  };

  let content: React.ReactNode;
  if (query.isPending) {
    content = (
      <Section>
        <SkeletonGroup style={styles.skeleton} label="Loading activity">
          <Skeleton height={88} radius={radius.md} />
          <Skeleton height={88} radius={radius.md} />
        </SkeletonGroup>
      </Section>
    );
  } else if (query.isError && events.length === 0) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />;
  } else if (events.length === 0) {
    content = (
      <EmptyState
        icon={BellIcon}
        title="No activity yet"
        message="Payments, funding milestones and updates for campaigns you back or follow will appear here."
        action={{ label: 'Explore campaigns', onPress: () => router.navigate('/explore') }}
      />
    );
  } else {
    content = (
      <Section>
        <Card padded={false}>
          {events.map((event, i) => (
            <Animated.View
              key={event.id}
              entering={FadeInDown.delay(Math.min(i, motion.staggerCap) * motion.staggerMs)
                .springify()
                .damping(spring.gentle.damping)
                .stiffness(spring.gentle.stiffness)}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              <EventRow event={event} />
            </Animated.View>
          ))}
        </Card>
      </Section>
    );
  }

  return (
    <Screen title="Activity" onRefresh={onRefresh} refreshing={refreshing}>
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeleton: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.md, padding: layout.cardPadding, alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  unread: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
});
