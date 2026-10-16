import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { HowItWorksSheet } from '@/components/campaign/how-it-works';
import { CoverImage } from '@/components/campaign/cover-image';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { IconButton } from '@/components/ui/icon-button';
import { InfoIcon, MicrophoneIcon, PencilSimpleIcon, TrashIcon, type IconComponent } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { StatusPill } from '@/components/ui/status-pill';
import { Text } from '@/components/ui/text';
import { DRAFT_STEPS, draftStepLabels, type DraftSummary } from '@/domain/draft';
import type { CampaignSummary } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { useMyCampaigns } from '@/features/creator/queries';
import { useCreateDraft, useDeleteDraft, useDrafts } from '@/features/drafts/queries';
import { formatRelative } from '@/lib/format';
import { describeError } from '@/services';
import { toast } from '@/stores/toast';
import { duration, layout, motion, radius, space, useTheme } from '@/theme';

const STEPS = [
  { title: 'Basics', body: 'Title, category, who you are and a short summary.' },
  { title: 'Story', body: 'The full message, with images, statistics and sources.' },
  { title: 'Campaign & Ad Visuals', body: 'Cover, ad images and the copy people see first.' },
  { title: 'Reach', body: 'Where and who the message should reach, and for how long.' },
  { title: 'Submit', body: 'Set your funding goal, preview everything and submit for review.' },
];

function StartOption({
  icon: Icon,
  title,
  body,
  onPress,
  loading,
}: {
  icon: IconComponent;
  title: string;
  body: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.option} onPress={loading ? undefined : onPress} accessibilityLabel={`${title}. ${body}`}>
      <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
        {loading ? <ActivityIndicator color={colors.primary} /> : <Icon size={22} color={colors.primary} />}
      </View>
      <View style={styles.optionText}>
        <Text variant="title3">{title}</Text>
        <Text variant="subhead" color="textMuted">
          {body}
        </Text>
      </View>
    </Card>
  );
}

function DraftRow({ draft, onDelete }: { draft: DraftSummary; onDelete: () => void }) {
  const stepNumber = DRAFT_STEPS.indexOf(draft.step) + 1;
  const title = draft.title || 'Untitled campaign';
  const meta = `Step ${stepNumber} of ${DRAFT_STEPS.length} · ${draftStepLabels[draft.step]} · Saved ${formatRelative(draft.updatedAt)}`;
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/draft/[id]', params: { id: draft.id } })}
      scaleTo={motion.pressScale.row}
      accessibilityLabel={`Continue ${title}. ${meta}`}
      style={styles.row}>
      <CoverImage image={draft.cover} category={draft.category ?? 'other'} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="footnote" color="textMuted" numberOfLines={2}>
          {meta}
        </Text>
      </View>
      <IconButton icon={TrashIcon} accessibilityLabel={`Delete draft ${title}`} size={36} onPress={onDelete} />
    </PressableScale>
  );
}

function CampaignStatusRow({ campaign }: { campaign: CampaignSummary }) {
  const live = campaign.status === 'funding';
  return (
    <PressableScale
      onPress={() =>
        live
          ? router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })
          : router.push({ pathname: '/submitted/[id]', params: { id: campaign.id } })
      }
      scaleTo={motion.pressScale.row}
      accessibilityLabel={`${campaign.title}. ${live ? 'Open the live campaign' : 'See review status'}`}
      style={styles.row}>
      <CoverImage image={campaign.cover} category={campaign.category} style={styles.thumb} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {campaign.title}
        </Text>
        <View style={styles.pill}>
          <StatusPill status={campaign.status} />
        </View>
      </View>
    </PressableScale>
  );
}

/** Create hub: start manually or by voice, pick up a draft where you left it, follow your submissions. */
export default function CreateScreen() {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const [aboutOpen, setAboutOpen] = useState(false);
  const drafts = useDrafts();
  const mine = useMyCampaigns();
  const createDraft = useCreateDraft();
  const deleteDraft = useDeleteDraft();

  const startManual = () =>
    createDraft.mutate(
      { origin: 'manual' },
      {
        onSuccess: (draft) => router.push({ pathname: '/draft/[id]', params: { id: draft.id } }),
        onError: (e) => toast(describeError(e).title, 'error'),
      },
    );

  const confirmDelete = (draft: DraftSummary) =>
    Alert.alert('Delete this draft?', `“${draft.title || 'Untitled campaign'}” will be removed from this device. This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteDraft.mutate(draft.id, {
            onSuccess: () => toast('Draft deleted'),
            onError: (e) => toast(describeError(e).title, 'error'),
          }),
      },
    ]);

  const draftList = drafts.data ?? [];
  const campaigns = mine.data ?? [];

  return (
    <Screen
      title="Create"
      headerRight={<IconButton icon={InfoIcon} accessibilityLabel="How Campaigns works" onPress={() => setAboutOpen(true)} />}>
      <HowItWorksSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <Section>
        <Text variant="body" color="textMuted" style={styles.intro}>
          Share a message you want more people to see. Every campaign is reviewed before backers can fund its reach.
        </Text>
        <View style={styles.options}>
          <StartOption
            icon={PencilSimpleIcon}
            title="Create manually"
            body="A guided, five-step form with a full preview before you submit."
            onPress={startManual}
            loading={createDraft.isPending}
          />
          <StartOption
            icon={MicrophoneIcon}
            title="Create with your voice"
            body="Answer four questions out loud. We draft it; you edit everything."
            onPress={() => router.push('/voice')}
          />
        </View>
      </Section>

      {draftList.length > 0 && (
        <Section title="Continue a draft">
          <Card padded={false}>
            {draftList.map((d, i) => (
              <Animated.View key={d.id} layout={LinearTransition.duration(duration.base)} exiting={FadeOut.duration(duration.fast)}>
                {i > 0 && <Divider inset={layout.cardPadding} />}
                <DraftRow draft={d} onDelete={() => confirmDelete(d)} />
              </Animated.View>
            ))}
          </Card>
          {!user && (
            <Text variant="footnote" color="textMuted" style={styles.note}>
              Drafts are saved on this device. You’ll sign in when you submit.
            </Text>
          )}
        </Section>
      )}

      {campaigns.length > 0 && (
        <Section title="Your campaigns">
          <Card padded={false}>
            {campaigns.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Divider inset={layout.cardPadding} />}
                <CampaignStatusRow campaign={c} />
              </View>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Five steps to a campaign">
        <View>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.dot, { borderColor: colors.primary }]}>
                  <Text variant="caption" color="primary">
                    {i + 1}
                  </Text>
                </View>
                {i < STEPS.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyStrong">{step.title}</Text>
                <Text variant="subhead" color="textMuted">
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: space.xl },
  options: { gap: space.md },
  option: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  optionIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: layout.cardPadding, paddingRight: space.sm, paddingVertical: space.md },
  rowText: { flex: 1, gap: 2 },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
  pill: { flexDirection: 'row', marginTop: 2 },
  note: { marginTop: space.sm },
  step: { flexDirection: 'row', gap: space.lg },
  rail: { alignItems: 'center', width: 28 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 1.5, flex: 1, marginVertical: space.xs },
  stepText: { flex: 1, gap: 2, paddingBottom: space.xl, paddingTop: 3 },
});
