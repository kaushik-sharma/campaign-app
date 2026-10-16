import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { CoverImage } from '@/components/campaign/cover-image';
import { DraftRow } from '@/components/create/draft-row';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { EstimatedReach } from '@/components/ui/estimate';
import { CaretRightIcon, PencilSimpleIcon, RocketLaunchIcon, UserCircleIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status-pill';
import { TabStrip } from '@/components/ui/tab-strip';
import { Text } from '@/components/ui/text';
import { dashboardTabLabels, dashboardTabOf, nextAction, type DashboardTab } from '@/domain/creator';
import type { DraftSummary } from '@/domain/draft';
import { fundingProgress } from '@/domain/money';
import type { CampaignSummary } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { creatorKeys, useMyCampaigns } from '@/features/creator/queries';
import { draftKeys, useDeleteDraft, useDrafts } from '@/features/drafts/queries';
import { formatMoney, formatPercent, formatTimeLeft } from '@/lib/format';
import { describeError } from '@/services';
import { toast } from '@/stores/toast';
import { duration, layout, motion, radius, space, useTheme } from '@/theme';

const TABS: DashboardTab[] = ['drafts', 'review', 'funding', 'promoting', 'completed', 'action'];

const EMPTY: Record<DashboardTab, string> = {
  drafts: 'No drafts. Start one from the Create tab.',
  review: 'Nothing in review right now.',
  funding: 'No campaigns are raising funds right now.',
  promoting: 'No ads are running right now.',
  completed: 'Finished campaigns and their reports appear here.',
  action: 'Nothing needs your attention.',
};

/** A dashboard row: everything needed to decide what to do next, one tap from managing it. */
function CampaignManageRow({ campaign }: { campaign: CampaignSummary }) {
  const { colors } = useTheme();
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  const left = campaign.status === 'funding' ? formatTimeLeft(campaign.fundingEndsAt) : null;
  const urgent = campaign.status === 'changes-requested';
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/manage/[id]', params: { id: campaign.id } })}
      scaleTo={motion.pressScale.row}
      accessibilityLabel={`${campaign.title}. ${formatPercent(progress)} funded. Next: ${nextAction(campaign)}`}
      style={styles.row}>
      <View style={styles.rowTop}>
        <CoverImage image={campaign.cover} category={campaign.category} style={styles.thumb} />
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {campaign.title}
          </Text>
          <View style={styles.pill}>
            <StatusPill status={campaign.status} />
          </View>
        </View>
      </View>
      <ProgressBar value={progress} animateOnMount={false} />
      <View style={styles.meta}>
        <Text variant="footnote" tabular>
          {formatMoney(campaign.raisedCents)}
          <Text variant="footnote" color="textMuted">{` of ${formatMoney(campaign.goalCents)} · ${formatPercent(progress)}`}</Text>
        </Text>
        {left && (
          <Text variant="footnote" color="textMuted">
            {left}
          </Text>
        )}
      </View>
      <EstimatedReach amountCents={campaign.goalCents} variant="footnote" suffix="people at goal" />
      <View style={[styles.next, { backgroundColor: urgent ? colors.warningSoft : colors.surfaceSunken }]}>
        <Text variant="subhead" color={urgent ? 'warning' : 'text'} style={styles.flex}>
          {nextAction(campaign)}
        </Text>
        <CaretRightIcon size={16} color={urgent ? colors.warning : colors.textMuted} />
      </View>
    </PressableScale>
  );
}

/** Creator dashboard: every campaign and draft, sorted into stages with what to do next. */
export default function DashboardScreen() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const drafts = useDrafts();
  const mine = useMyCampaigns();
  const deleteDraft = useDeleteDraft();
  const [picked, setTab] = useState<DashboardTab | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const campaigns = mine.data ?? [];
  const draftList = drafts.data ?? [];
  const inTab = (t: DashboardTab) => (t === 'drafts' ? draftList.length : campaigns.filter((c) => dashboardTabOf(c.status) === t).length);
  // Until the creator picks a tab, open the most pressing stage that has something in it.
  const tab = picked ?? (['action', 'funding', 'promoting', 'review', 'drafts', 'completed'] as const).find((t) => inTab(t) > 0) ?? 'drafts';
  const listed = campaigns.filter((c) => dashboardTabOf(c.status) === tab);

  const totalRaised = campaigns.reduce((s, c) => s + c.raisedCents, 0);
  const totalBackers = campaigns.reduce((s, c) => s + c.backerCount, 0);
  const live = campaigns.filter((c) => ['funding', 'goal-reached', 'distribution-prep', 'promoting'].includes(c.status)).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: creatorKeys.all }),
      queryClient.refetchQueries({ queryKey: draftKeys.list() }),
    ]);
    setRefreshing(false);
  };

  const confirmDelete = (d: DraftSummary) =>
    Alert.alert('Delete this draft?', `“${d.title || 'Untitled campaign'}” will be removed. This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDraft.mutate(d.id, { onError: (e) => toast(describeError(e).title, 'error') }),
      },
    ]);

  if (!user) {
    return (
      <Screen title="Dashboard" back>
        <EmptyState
          icon={UserCircleIcon}
          title="Sign in to see your campaigns"
          message="Your dashboard shows every campaign you’ve submitted, how it’s doing and what to do next."
          action={{ label: 'Sign in', onPress: () => router.push('/auth') }}
        />
      </Screen>
    );
  }

  let body: React.ReactNode;
  if (mine.isPending || drafts.isPending) {
    body = (
      <SkeletonGroup style={styles.skeleton} label="Loading your campaigns">
        <Skeleton height={180} radius={radius.lg} />
        <Skeleton height={180} radius={radius.lg} />
      </SkeletonGroup>
    );
  } else if (mine.isError) {
    body = <ErrorState error={mine.error} onRetry={() => void mine.refetch()} retrying={mine.isRefetching} />;
  } else if (tab === 'drafts') {
    body = draftList.length ? (
      <Card padded={false}>
        {draftList.map((d, i) => (
          <View key={d.id}>
            {i > 0 && <Divider inset={layout.cardPadding} />}
            <DraftRow draft={d} onDelete={() => confirmDelete(d)} />
          </View>
        ))}
      </Card>
    ) : (
      <EmptyState icon={PencilSimpleIcon} title="No drafts" message={EMPTY.drafts} compact action={{ label: 'Create a campaign', onPress: () => router.navigate('/create') }} />
    );
  } else if (listed.length === 0) {
    body = <EmptyState icon={RocketLaunchIcon} title={dashboardTabLabels[tab]} message={EMPTY[tab]} compact />;
  } else {
    body = (
      <View style={styles.list}>
        {listed.map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, motion.staggerCap) * motion.staggerMs).duration(duration.slow)}>
            <Card padded={false}>
              <CampaignManageRow campaign={c} />
            </Card>
          </Animated.View>
        ))}
      </View>
    );
  }

  return (
    <Screen title="Dashboard" back onRefresh={onRefresh} refreshing={refreshing}>
      <Section>
        <View style={styles.stats}>
          <Card style={styles.stat}>
            <AnimatedNumber value={totalRaised} format="money" variant="title2" />
            <Text variant="caption" color="textMuted">
              Raised in total
            </Text>
          </Card>
          <Card style={styles.stat}>
            <AnimatedNumber value={totalBackers} variant="title2" />
            <Text variant="caption" color="textMuted">
              Backers
            </Text>
          </Card>
          <Card style={styles.stat}>
            <AnimatedNumber value={live} variant="title2" />
            <Text variant="caption" color="textMuted">
              Live
            </Text>
          </Card>
        </View>
      </Section>

      <TabStrip<DashboardTab>
        accessibilityLabel="Campaign stages"
        value={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({ value: t, label: dashboardTabLabels[t], count: inTab(t) }))}
      />

      <Animated.View key={tab} entering={FadeIn.duration(duration.base)} style={styles.body}>
        {body}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: 2, padding: space.md },
  body: { paddingHorizontal: layout.gutter, paddingTop: space.lg },
  list: { gap: space.md },
  skeleton: { gap: space.md },
  row: { padding: layout.cardPadding, gap: space.md },
  rowTop: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  pill: { flexDirection: 'row', marginTop: space.xs },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  next: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md },
});
