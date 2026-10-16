import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { CoverImage } from '@/components/campaign/cover-image';
import { LifecycleTimeline } from '@/components/create/lifecycle-timeline';
import { BarRow, Figure } from '@/components/report/charts';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  FastForwardIcon,
  FileTextIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  WrenchIcon,
} from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status-pill';
import { TabStrip } from '@/components/ui/tab-strip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { demo } from '@/config/demo';
import { hasReport, nextAction } from '@/domain/creator';
import { isPublic } from '@/domain/lifecycle';
import { fundingProgress } from '@/domain/money';
import type { Campaign } from '@/domain/types';
import { useDraftForCampaign, useMyCampaign, usePostUpdate } from '@/features/creator/queries';
import { useDevControls } from '@/features/dev/use-dev-controls';
import { useReport } from '@/features/reports/queries';
import { formatCompact, formatInteger, formatMoney, formatPercent, formatReachRange, formatRelative, formatTimeLeft } from '@/lib/format';
import { shareCampaign } from '@/lib/share';
import { describeError, isServiceError } from '@/services';
import { toast } from '@/stores/toast';
import { duration, layout, radius, space, useTheme } from '@/theme';

type Tab = 'status' | 'analytics' | 'updates';

function Milestones({ campaign }: { campaign: Campaign }) {
  const { colors } = useTheme();
  const progress = fundingProgress(campaign.raisedCents, campaign.goalCents);
  return (
    <View style={styles.milestones}>
      {demo.funding.milestones.map((m) => {
        const reached = progress >= m;
        return (
          <View
            key={m}
            style={[styles.milestone, { backgroundColor: reached ? colors.successSoft : colors.surfaceSunken }]}
            accessible
            accessibilityLabel={`${formatPercent(m)} milestone${reached ? ', reached' : ''}`}>
            {reached && <CheckIcon size={12} color={colors.success} weight="bold" />}
            <Text variant="caption" color={reached ? 'success' : 'textMuted'}>
              {m >= 1 ? 'Goal' : formatPercent(m)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StatusTab({ campaign, draftId }: { campaign: Campaign; draftId: string | null }) {
  const { colors } = useTheme();
  const dev = useDevControls();
  const [advancing, setAdvancing] = useState(false);
  const feedback = campaign.status === 'changes-requested' || campaign.status === 'rejected' ? campaign.history.at(-1) : undefined;
  const editable = !!draftId && ['funding', 'goal-reached'].includes(campaign.status);

  const openEditor = (step?: string) =>
    draftId && router.push({ pathname: '/draft/[id]', params: { id: draftId, resubmit: '1', ...(step ? { step } : {}) } });

  const editLive = () =>
    Alert.alert(
      'Edit a live campaign?',
      'Changes to the story, sources, visuals or targeting are material: the campaign goes back to review and backing pauses until it’s approved again. Money raised so far is kept.\n\nTo share news without a new review, post an update instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit and resubmit', style: 'destructive', onPress: () => openEditor('basics') },
      ],
    );

  return (
    <View style={styles.tabBody}>
      {feedback && (
        <Card tone="sunken" elevation="e0" style={styles.stack}>
          <Text variant="bodyStrong">{campaign.status === 'rejected' ? 'Why it wasn’t approved' : 'What the reviewers asked for'}</Text>
          <Text variant="subhead" color="textMuted">
            {feedback.note ?? 'The campaign didn’t meet the campaign rules.'}
          </Text>
          {campaign.status === 'changes-requested' && draftId && (
            <Button label="Edit & resubmit" icon={PencilSimpleIcon} onPress={() => openEditor(feedback.editStep)} />
          )}
        </Card>
      )}

      <Card style={styles.stack}>
        <Text variant="overline" color="textMuted">
          Progress
        </Text>
        <LifecycleTimeline campaign={campaign} />
      </Card>

      {isPublic(campaign.status) && (
        <Card style={styles.stack}>
          <Text variant="overline" color="textMuted">
            Funding milestones
          </Text>
          <Milestones campaign={campaign} />
        </Card>
      )}

      <View style={styles.actions}>
        {isPublic(campaign.status) && (
          <>
            <Button label="Share campaign" icon={ShareNetworkIcon} fullWidth onPress={() => void shareCampaign(campaign)} />
            <Button
              label="View public page"
              variant="secondary"
              icon={EyeIcon}
              fullWidth
              onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}
            />
          </>
        )}
        {hasReport(campaign.status) && (
          <Button label="Delivery report" variant="secondary" icon={FileTextIcon} fullWidth onPress={() => router.push({ pathname: '/report/[id]', params: { id: campaign.id } })} />
        )}
        {editable && <Button label="Edit campaign" variant="ghost" icon={PencilSimpleIcon} fullWidth onPress={editLive} />}
      </View>

      <Card tone="sunken" elevation="e0" style={styles.stack}>
        <View style={styles.devHeader}>
          <WrenchIcon size={16} color={colors.textMuted} />
          <Text variant="subhead" style={styles.flex}>
            Developer controls
          </Text>
        </View>
        <Text variant="footnote" color="textMuted">
          Moves this campaign to its next stage now (funding closes, ads set up, ads live, completed), sending the notifications backers and followers would get.
        </Text>
        <Button
          label="Move to next stage"
          size="sm"
          variant="secondary"
          icon={FastForwardIcon}
          loading={advancing}
          onPress={async () => {
            setAdvancing(true);
            try {
              toast(await dev.advanceCampaign(campaign.id));
            } finally {
              setAdvancing(false);
            }
          }}
        />
      </Card>
    </View>
  );
}

function AnalyticsTab({ campaign }: { campaign: Campaign }) {
  const report = useReport(campaign.id);
  const r = report.data;
  return (
    <View style={styles.tabBody}>
      <View style={styles.figures}>
        <Card style={styles.metric}>
          <AnimatedNumber value={campaign.raisedCents} format="money" variant="title2" />
          <Text variant="caption" color="textMuted">
            Raised
          </Text>
        </Card>
        <Card style={styles.metric}>
          <AnimatedNumber value={campaign.backerCount} variant="title2" />
          <Text variant="caption" color="textMuted">
            Backers
          </Text>
        </Card>
      </View>

      {!r ? (
        report.isError ? (
          <ErrorState error={report.error} onRetry={() => void report.refetch()} compact />
        ) : (
          <SkeletonGroup style={styles.stack} label="Loading analytics">
            <Skeleton height={140} radius={radius.lg} />
          </SkeletonGroup>
        )
      ) : (
        <>
          <Card style={styles.stack}>
            <Text variant="overline" color="textMuted">
              Ad budget vs spend
            </Text>
            <BarRow label="Ad budget" value={r.money.adBudgetCents} max={Math.max(r.money.adBudgetCents, 1)} display={formatMoney(r.money.adBudgetCents)} />
            <BarRow label="Spent so far" value={r.money.spentCents} max={Math.max(r.money.adBudgetCents, 1)} display={formatMoney(r.money.spentCents)} delay={150} />
            <Text variant="footnote" color="textMuted">
              {r.money.unspentNote}
            </Text>
          </Card>

          <View style={styles.figures}>
            <Figure label="Reach" value={formatReachRange(r.estimated.reach)} kind="estimated" note="For the amount raised" />
            {r.measured ? (
              <>
                <Figure label="Reach" value={formatCompact(r.measured.reach)} kind="measured" />
                <Figure label="Impressions" value={formatCompact(r.measured.impressions)} kind="measured" />
                <Figure label="Clicks" value={formatInteger(r.measured.clicks)} kind="measured" />
                <Figure label="CTR" value={`${(r.measured.ctr * 100).toFixed(2)}%`} kind="measured" />
              </>
            ) : (
              <Figure label="Impressions" value={formatCompact(r.estimated.impressions)} kind="estimated" note="Measured once ads run" />
            )}
          </View>

          <Button
            label="Open full report"
            variant="secondary"
            icon={ArrowRightIcon}
            iconPosition="trailing"
            fullWidth
            onPress={() => router.push({ pathname: '/report/[id]', params: { id: campaign.id } })}
          />
        </>
      )}
    </View>
  );
}

function UpdatesTab({ campaign }: { campaign: Campaign }) {
  const post = usePostUpdate(campaign.id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canPost = isPublic(campaign.status);

  const submit = () =>
    post.mutate(
      { title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setErrors({});
          toast('Update posted. Backers and followers were notified.', 'success');
        },
        onError: (e) => {
          if (isServiceError(e) && e.fieldErrors) setErrors(e.fieldErrors);
          else toast(describeError(e).title, 'error');
        },
      },
    );

  return (
    <View style={styles.tabBody}>
      {canPost ? (
        <Card style={styles.stack}>
          <Text variant="bodyStrong">Post an update</Text>
          <Text variant="footnote" color="textMuted">
            Updates appear on your campaign page and notify backers and followers. They don’t need a new review.
          </Text>
          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={60} error={errors.title} />
          <TextField label="Update" multiline value={body} onChangeText={setBody} maxLength={500} error={errors.body} />
          <Button label="Post update" loading={post.isPending} disabled={!title.trim() || !body.trim()} onPress={submit} />
        </Card>
      ) : (
        <Text variant="subhead" color="textMuted">
          You can post updates once the campaign is open for backing.
        </Text>
      )}
      {campaign.updates.map((u) => (
        <Animated.View key={u.id} entering={FadeIn.duration(duration.base)}>
          <Card tone="sunken" elevation="e0" style={styles.update}>
            <Text variant="caption" color="textMuted">
              {formatRelative(u.at)}
            </Text>
            <Text variant="bodyStrong">{u.title}</Text>
            <Text variant="subhead" color="textMuted">
              {u.body}
            </Text>
          </Card>
        </Animated.View>
      ))}
    </View>
  );
}

/** Manage one of my campaigns: where it is in the lifecycle, how it's performing, and updates. */
export default function ManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useMyCampaign(id);
  const draftFor = useDraftForCampaign(id, true);
  const [tab, setTab] = useState<Tab>('status');
  const c = query.data;

  if (!c) {
    return (
      <Screen title="Manage" back>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
        ) : (
          <SkeletonGroup style={styles.skeleton} label="Loading campaign">
            <Skeleton height={120} radius={radius.lg} />
            <Skeleton height={300} radius={radius.lg} />
          </SkeletonGroup>
        )}
      </Screen>
    );
  }

  const progress = fundingProgress(c.raisedCents, c.goalCents);
  const left = c.status === 'funding' ? formatTimeLeft(c.fundingEndsAt) : null;

  return (
    <Screen title="Manage" back>
      <Section>
        <Card style={styles.stack}>
          <View style={styles.head}>
            <CoverImage image={c.cover} category={c.category} style={styles.thumb} />
            <View style={styles.flex}>
              <Text variant="title3" numberOfLines={2}>
                {c.title}
              </Text>
              <View style={styles.pill}>
                <StatusPill status={c.status} />
              </View>
            </View>
          </View>
          <ProgressBar value={progress} height={6} />
          <View style={styles.meta}>
            <Text variant="footnote" tabular>
              {formatMoney(c.raisedCents)}
              <Text variant="footnote" color="textMuted">{` of ${formatMoney(c.goalCents)} · ${c.backerCount} backers`}</Text>
            </Text>
            {left && (
              <Text variant="footnote" color="textMuted">
                {left}
              </Text>
            )}
          </View>
          <Divider />
          <Text variant="subhead" color="primary">
            {`Next: ${nextAction(c)}`}
          </Text>
        </Card>
      </Section>

      <TabStrip<Tab>
        accessibilityLabel="Manage sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'status', label: 'Status' },
          { value: 'analytics', label: 'Analytics' },
          { value: 'updates', label: 'Updates', count: c.updates.length },
        ]}
      />

      <Animated.View key={tab} entering={FadeIn.duration(duration.base)}>
        {tab === 'status' && <StatusTab campaign={c} draftId={draftFor.data ?? null} />}
        {tab === 'analytics' && <AnalyticsTab campaign={c} />}
        {tab === 'updates' && <UpdatesTab campaign={c} />}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: space.md },
  head: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  pill: { flexDirection: 'row', marginTop: space.xs },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  tabBody: { paddingHorizontal: layout.gutter, paddingTop: space.lg, gap: space.lg },
  milestones: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.pill },
  actions: { gap: space.sm },
  devHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  metric: { flex: 1, gap: 2, padding: space.md },
  update: { gap: space.xs },
  skeleton: { paddingHorizontal: layout.gutter, gap: space.lg },
});
