import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight, FadeOutLeft, FadeOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BasicsStep } from '@/components/create/basics-step';
import { EditorStatus, type EditorMode } from '@/components/create/editor-status';
import { ReachStep } from '@/components/create/reach-step';
import { Stepper } from '@/components/create/stepper';
import { StoryStep } from '@/components/create/story-step';
import { SubmitStep } from '@/components/create/submit-step';
import { VisualsStep } from '@/components/create/visuals-step';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { SparkleIcon, WarningCircleIcon, XIcon } from '@/components/ui/icons';
import { ErrorState } from '@/components/ui/states';
import { StepLayout } from '@/components/ui/step-layout';
import { Text } from '@/components/ui/text';
import { DRAFT_STEPS, validateStep, type Draft, type DraftStep, type FieldErrors } from '@/domain/draft';
import { useRequireAuth } from '@/features/auth/require-auth';
import { draftKeys, useDraft, useSubmitDraft } from '@/features/drafts/queries';
import { useAutosave } from '@/features/drafts/use-autosave';
import { haptics } from '@/lib/haptics';
import { describeError, isServiceError } from '@/services';
import { toast } from '@/stores/toast';
import { duration, easing, layout, radius, space, useTheme } from '@/theme';

const indexOf = (s: DraftStep) => DRAFT_STEPS.indexOf(s);

/**
 * The five-step campaign editor. Every change autosaves; the current step is part of the draft,
 * so a killed app resumes exactly here. Continue validates the step and shows specific errors;
 * Back (button, header or Android back) never loses anything.
 */
export default function DraftEditorScreen() {
  const { id, fromVoice, resubmit } = useLocalSearchParams<{ id: string; fromVoice?: string; resubmit?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useDraft(id);
  const queryClient = useQueryClient();
  const submitDraft = useSubmitDraft();
  const requireAuth = useRequireAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [draft, setDraft] = useState<Draft | null>(null);
  // Take the server copy once; from then on the editor owns the draft and autosaves it.
  if (!draft && query.data) setDraft(query.data);

  const [direction, setDirection] = useState<1 | -1>(1);
  const [attempted, setAttempted] = useState<Partial<Record<DraftStep, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [storyPreview, setStoryPreview] = useState(false);
  const autosave = useAutosave(draft);
  const latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
  }, [draft]);

  const step = draft?.step ?? 'basics';
  const stepServerErrors = Object.fromEntries(Object.entries(serverErrors).filter(([k]) => k.startsWith(`${step}.`)));
  const errors: FieldErrors = draft && attempted[step] ? { ...stepServerErrors, ...validateStep(draft, step) } : {};
  const errorCount = Object.keys(errors).length;

  const update = (recipe: (d: Draft) => Draft) => setDraft((d) => (d ? recipe(d) : d));

  const goTo = (next: DraftStep) => {
    if (!draft || next === step) return;
    setDirection(indexOf(next) > indexOf(step) ? 1 : -1);
    setStoryPreview(false);
    update((d) => ({ ...d, step: next }));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const isComplete = (s: DraftStep) => !!draft && Object.keys(validateStep(draft, s)).length === 0;
  // Earlier steps are always reachable; later ones only if every step before them is complete.
  const canJumpTo = (target: DraftStep) =>
    indexOf(target) < indexOf(step) || DRAFT_STEPS.slice(0, indexOf(target)).every(isComplete);

  const goBack = () => {
    const i = indexOf(step);
    if (i > 0) goTo(DRAFT_STEPS[i - 1]);
    else router.back();
  };

  // Android back steps backwards through the flow before leaving the editor.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (indexOf(step) > 0) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });

  const continueOrSubmit = () => {
    if (!draft) return;
    const found = validateStep(draft, step);
    if (Object.keys(found).length) {
      setAttempted((a) => ({ ...a, [step]: true }));
      setServerErrors({});
      haptics.error();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (step !== 'submit') {
      goTo(DRAFT_STEPS[indexOf(step) + 1]);
      return;
    }
    // Guests sign in first; submission then continues with the latest draft.
    requireAuth('submit', () => {
      if (latest.current) submit(latest.current);
    });
  };

  const submit = (d: Draft) =>
    submitDraft.mutate(d, {
      onSuccess: (campaign) => {
        haptics.success();
        router.replace({ pathname: '/submitted/[id]', params: { id: campaign.id, fresh: '1' } });
      },
      onError: (e) => {
        haptics.error();
        if (isServiceError(e) && e.code === 'validation' && e.fieldErrors) {
          // Server-side validation disagrees: jump to the first step it flagged.
          const firstKey = Object.keys(e.fieldErrors)[0] ?? '';
          const target = DRAFT_STEPS.find((s) => firstKey.startsWith(`${s}.`)) ?? 'submit';
          setServerErrors(e.fieldErrors);
          setAttempted((a) => ({ ...a, [target]: true }));
          goTo(target);
        }
        toast(isServiceError(e) && e.code === 'validation' ? e.message : describeError(e).title, 'error');
      },
    });

  const mode: EditorMode = submitDraft.isPending ? 'submitting' : storyPreview && step === 'story' ? 'previewing' : 'editing';

  if (!draft) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.bg }]}>
        {query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} /> : <ActivityIndicator />}
      </View>
    );
  }

  const stepProps = { draft, update, errors };
  const isLast = step === 'submit';
  const entering = (direction > 0 ? FadeInRight : FadeInLeft).duration(duration.slow).easing(easing.enter);
  const exiting = (direction > 0 ? FadeOutLeft : FadeOutRight).duration(duration.base).easing(easing.exit);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Swipe-back leaves the editor only from the first step; later steps go back one step. */}
      <Stack.Screen options={{ gestureEnabled: step === 'basics' && !submitDraft.isPending }} />

      <View style={[styles.header, { paddingTop: insets.top + space.xs, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Text variant="title3" numberOfLines={1} style={styles.flex}>
            {draft.basics.title.trim() || 'New campaign'}
          </Text>
          <IconButton
            icon={XIcon}
            accessibilityLabel="Close editor. Your draft is saved."
            variant="tinted"
            size={32}
            disabled={submitDraft.isPending}
            onPress={() => {
              void autosave.flush();
              router.back();
            }}
          />
        </View>
        <EditorStatus mode={mode} autosave={autosave.status} savedAt={autosave.savedAt} />
        <Stepper current={step} canJumpTo={canJumpTo} onJump={goTo} />
      </View>

      <View style={styles.body}>
        <Animated.View key={step} entering={entering} exiting={exiting} style={StyleSheet.absoluteFill}>
          <StepLayout
            scrollRef={scrollRef}
            footer={
              <View style={styles.footer}>
                <Button label="Back" variant="secondary" onPress={goBack} disabled={submitDraft.isPending} />
                <Button
                  label="Save draft"
                  variant="ghost"
                  disabled={submitDraft.isPending}
                  onPress={() => {
                    void autosave.flush();
                    toast('Draft saved', 'success');
                  }}
                />
                <Button
                  label={isLast ? (resubmit ? 'Resubmit' : 'Submit for review') : 'Continue'}
                  style={styles.primary}
                  loading={submitDraft.isPending}
                  onPress={continueOrSubmit}
                />
              </View>
            }>
            {errorCount > 0 && (
              <Animated.View entering={FadeIn.duration(duration.base)} style={[styles.banner, { backgroundColor: colors.dangerSoft }]} accessibilityLiveRegion="assertive">
                <WarningCircleIcon size={18} color={colors.danger} />
                <Text variant="subhead" color="danger" style={styles.flex}>
                  {errorCount === 1 ? 'Fix 1 thing to continue.' : `Fix ${errorCount} things to continue.`}
                </Text>
              </Animated.View>
            )}
            {fromVoice && step === 'basics' && (
              <View style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
                <SparkleIcon size={18} color={colors.primary} weight="fill" />
                <Text variant="subhead" color="primary" style={styles.flex}>
                  Drafted from your answers with AI. Review and edit everything; nothing is submitted until you choose.
                </Text>
              </View>
            )}
            {step === 'basics' && <BasicsStep {...stepProps} />}
            {step === 'story' && <StoryStep {...stepProps} previewing={storyPreview} onPreviewingChange={setStoryPreview} />}
            {step === 'visuals' && <VisualsStep {...stepProps} />}
            {step === 'reach' && <ReachStep {...stepProps} />}
            {step === 'submit' && (
              <SubmitStep
                {...stepProps}
                onJump={goTo}
                onPreview={() => {
                  // Hand the preview the exact local copy, so it never lags behind autosave.
                  queryClient.setQueryData(draftKeys.detail(draft.id), draft);
                  void autosave.flush();
                  router.push({ pathname: '/draft/[id]/preview', params: { id: draft.id } });
                }}
              />
            )}
          </StepLayout>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  header: { paddingHorizontal: layout.gutter, paddingBottom: space.md, gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  body: { flex: 1, overflow: 'hidden' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  primary: { flex: 1, alignSelf: 'auto' },
  banner: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.md },
});
