import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CoverImage } from '@/components/campaign/cover-image';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/divider';
import { IconButton } from '@/components/ui/icon-button';
import {
  ArrowClockwiseIcon,
  ArticleIcon,
  BellIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  GearSixIcon,
  HandshakeIcon,
  MegaphoneSimpleIcon,
  MinusCircleIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  RocketLaunchIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SparkleIcon,
  XCircleIcon,
  type IconComponent,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text, type TextColor } from '@/components/ui/text';
import { ACTIVITY_GROUPS, activityGroupLabels, activityGroupOf, activityLinkOf, groupDuplicates, type ActivityItem } from '@/domain/activity';
import { fundingProgress } from '@/domain/money';
import type { ActivityEvent, ActivityGroup, ActivityKind, CampaignSummary } from '@/domain/types';
import { openActivityLink } from '@/features/activity/navigation';
import { activityKeys, useActivity, useMarkActivityRead } from '@/features/activity/queries';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { useMyCampaignList } from '@/features/campaigns/queries';
import { formatDate, formatPercent, formatRelative, formatTimeLeft } from '@/lib/format';
import { usePreferences } from '@/stores/preferences';
import { duration, layout, motion, radius, space, spring, useTheme, type ColorTokens } from '@/theme';

const KIND: Record<ActivityKind, { icon: IconComponent; tone: TextColor }> = {
  'payment-succeeded': { icon: CheckCircleIcon, tone: 'success' },
  'payment-pending': { icon: ClockIcon, tone: 'warning' },
  'payment-failed': { icon: XCircleIcon, tone: 'danger' },
  'payment-cancelled': { icon: MinusCircleIcon, tone: 'textMuted' },
  refund: { icon: ArrowClockwiseIcon, tone: 'warning' },
  milestone: { icon: ChartLineUpIcon, tone: 'primary' },
  'goal-reached': { icon: SealCheckIcon, tone: 'success' },
  'funding-ended': { icon: HandshakeIcon, tone: 'textMuted' },
  'distribution-started': { icon: MegaphoneSimpleIcon, tone: 'primary' },
  'report-ready': { icon: FileTextIcon, tone: 'success' },
  'update-posted': { icon: ArticleIcon, tone: 'primary' },
  submitted: { icon: PaperPlaneTiltIcon, tone: 'primary' },
  approved: { icon: CheckCircleIcon, tone: 'success' },
  'changes-requested': { icon: PencilSimpleIcon, tone: 'warning' },
  rejected: { icon: XCircleIcon, tone: 'danger' },
  'funding-open': { icon: RocketLaunchIcon, tone: 'success' },
  welcome: { icon: SparkleIcon, tone: 'primary' },
  'sign-in': { icon: ShieldCheckIcon, tone: 'textMuted' },
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

function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatDate(iso);
}

/** Unread marker that fades out when the item is marked read. */
function UnreadDot({ unread }: { unread: boolean }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(unread ? 1 : 0);
  useEffect(() => {
    opacity.set(withTiming(unread ? 1 : 0, { duration: duration.slow }));
  }, [unread, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: 0.6 + 0.4 * opacity.get() }] }));
  return <Animated.View style={[styles.unread, { backgroundColor: colors.primary }, style]} />;
}

function EventRow({ event, compact }: { event: ActivityEvent; compact?: boolean }) {
  const { colors } = useTheme();
  const { icon: Icon, tone } = KIND[event.kind];
  const link = activityLinkOf(event);
  return (
    <PressableScale
      onPress={() => openActivityLink(link)}
      disabled={!link}
      scaleTo={motion.pressScale.row}
      accessibilityLabel={`${event.read ? '' : 'New. '}${event.title}. ${event.body}. ${formatRelative(event.at)}`}
      style={[styles.row, compact && styles.compactRow]}>
      {!compact && (
        <View style={[styles.icon, { backgroundColor: softOf(tone, colors) }]}>
          <Icon size={20} color={colors[tone]} weight="fill" />
        </View>
      )}
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text variant={compact ? 'subhead' : 'bodyStrong'} style={styles.flex} numberOfLines={2}>
            {event.title}
          </Text>
          <UnreadDot unread={!event.read} />
        </View>
        <Text variant={compact ? 'footnote' : 'subhead'} color="textMuted">
          {event.body}
        </Text>
        <Text variant="caption" color="textMuted">
          {formatRelative(event.at)}
        </Text>
      </View>
    </PressableScale>
  );
}

/** One notification, plus any same-day repeats folded under it. */
function ItemRow({ item }: { item: ActivityItem }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Animated.View layout={LinearTransition.springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness)}>
      <EventRow event={item.event} />
      {item.more.length > 0 && (
        <View style={styles.more}>
          <PressableScale
            onPress={() => setOpen((o) => !o)}
            scaleTo={0.97}
            accessibilityState={{ expanded: open }}
            accessibilityLabel={open ? 'Show less' : `${item.more.length} more like this`}
            style={[styles.morePill, { backgroundColor: colors.surfaceSunken }]}>
            <Text variant="caption" color="textMuted">
              {open ? 'Show less' : `${item.more.length} more like this`}
            </Text>
          </PressableScale>
          {open && (
            <Animated.View entering={FadeIn.duration(duration.base)} style={[styles.moreList, { borderLeftColor: colors.border }]}>
              {item.more.map((e) => (
                <EventRow key={e.id} event={e} compact />
              ))}
            </Animated.View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

function FollowingStrip({ campaigns }: { campaigns: CampaignSummary[] }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {campaigns.map((c, i) => {
        const progress = fundingProgress(c.raisedCents, c.goalCents);
        const left = c.status === 'funding' ? formatTimeLeft(c.fundingEndsAt) : null;
        return (
          <Animated.View key={c.id} entering={FadeInDown.delay(i * motion.staggerMs).duration(duration.slow)}>
            <PressableScale
              onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: c.id } })}
              scaleTo={motion.pressScale.card}
              accessibilityLabel={`${c.title}, ${formatPercent(progress)} funded`}
              style={[styles.followCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.followTop}>
                <CoverImage image={c.cover} category={c.category} style={styles.followThumb} />
                <ProgressRing value={progress} size={32} delay={200 + i * 80} />
              </View>
              <Text variant="subhead" numberOfLines={2}>
                {c.title}
              </Text>
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                {`${formatPercent(progress)} funded${left ? ` · ${left}` : ''}`}
              </Text>
            </PressableScale>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

type Filter = 'all' | ActivityGroup;

/**
 * Activity: notifications grouped by day and filterable by where they come from. New items keep
 * their dot until you mark them read (or leave the tab); repeats on the same day fold together.
 */
export default function ActivityScreen() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const query = useActivity();
  const following = useMyCampaignList('following');
  const markRead = useMarkActivityRead();
  const enabled = usePreferences((s) => s.notifications);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const visible = (query.data ?? []).filter((e) => enabled[activityGroupOf(e)]);
  const filtered = filter === 'all' ? visible : visible.filter((e) => activityGroupOf(e) === filter);
  const unreadCount = visible.filter((e) => !e.read).length;
  const unreadIn = (f: Filter) => (f === 'all' ? visible : visible.filter((e) => activityGroupOf(e) === f)).filter((e) => !e.read).length;

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
    await Promise.all([queryClient.refetchQueries({ queryKey: activityKeys.list() }), following.refetch()]);
    setRefreshing(false);
  };

  // Day sections, newest first.
  const sections: { day: string; items: ActivityItem[] }[] = [];
  for (const item of groupDuplicates(filtered)) {
    const day = dayLabel(item.event.at);
    const last = sections.at(-1);
    if (last?.day === day) last.items.push(item);
    else sections.push({ day, items: [item] });
  }

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
  } else if (query.isError && visible.length === 0) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />;
  } else if (filter !== 'all' && !enabled[filter]) {
    content = (
      <EmptyState
        icon={BellIcon}
        title={`${activityGroupLabels[filter]} notifications are off`}
        message="Turn them back on in notification settings."
        action={{ label: 'Notification settings', onPress: () => router.push('/settings/notifications') }}
      />
    );
  } else if (sections.length === 0) {
    content = (
      <EmptyState
        icon={BellIcon}
        title={filter === 'all' ? 'No activity yet' : `Nothing in ${activityGroupLabels[filter]}`}
        message="Payments, funding milestones, review decisions and updates for campaigns you back, follow or create appear here."
        action={{ label: 'Explore campaigns', onPress: () => router.navigate('/explore') }}
      />
    );
  } else {
    content = sections.map((section, s) => (
      <Section key={section.day} title={section.day}>
        <Card padded={false}>
          {section.items.map((item, i) => (
            <Animated.View key={item.key} entering={FadeInDown.delay(Math.min(s * 3 + i, motion.staggerCap) * motion.staggerMs).duration(duration.slow)}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              <ItemRow item={item} />
            </Animated.View>
          ))}
        </Card>
      </Section>
    ));
  }

  const filters: Filter[] = ['all', ...ACTIVITY_GROUPS];

  return (
    <Screen
      title="Activity"
      onRefresh={onRefresh}
      refreshing={refreshing}
      headerRight={<IconButton icon={GearSixIcon} accessibilityLabel="Notification settings" onPress={() => router.push('/settings/notifications')} />}>
      {user && (following.data?.length ?? 0) > 0 && (
        <Section title="Following" bleed>
          <FollowingStrip campaigns={following.data ?? []} />
        </Section>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterRow}>
        {filters.map((f) => {
          const n = unreadIn(f);
          return (
            <Chip
              key={f}
              label={f === 'all' ? 'All' : activityGroupLabels[f]}
              count={n > 0 ? n : undefined}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          );
        })}
      </ScrollView>

      {unreadCount > 0 && (
        <View style={styles.markRow}>
          <Text variant="footnote" color="textMuted" style={styles.flex}>
            {`${unreadCount} new`}
          </Text>
          <PressableScale onPress={() => markAllRead()} scaleTo={0.95} hitSlop={10} accessibilityLabel="Mark all as read">
            <Text variant="subhead" color="primary">
              Mark all read
            </Text>
          </PressableScale>
        </View>
      )}

      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeleton: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.md, padding: layout.cardPadding, alignItems: 'flex-start' },
  compactRow: { paddingVertical: space.sm, paddingLeft: space.md },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  unread: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  more: { paddingLeft: layout.cardPadding + 36 + space.md, paddingRight: layout.cardPadding, paddingBottom: space.md, gap: space.xs },
  morePill: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  moreList: { borderLeftWidth: 2 },
  strip: { gap: space.sm, paddingHorizontal: layout.gutter },
  followCard: { width: 156, padding: space.md, gap: space.xs, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  followTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs },
  followThumb: { width: 36, height: 36, borderRadius: radius.sm },
  filterRow: { flexGrow: 0, marginBottom: space.md },
  filters: { gap: space.sm, paddingHorizontal: layout.gutter },
  markRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.gutter, marginBottom: space.sm },
});
