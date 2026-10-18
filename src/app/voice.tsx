import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MicButton, Waveform } from '@/components/create/voice-visuals';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { ArrowLeftIcon, KeyboardIcon, SparkleIcon, XIcon } from '@/components/ui/icons';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { StepLayout } from '@/components/ui/step-layout';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { DEMO_TRANSCRIPTS, VOICE_QUESTIONS } from '@/content/voice-demo';
import type { VoiceAnswers } from '@/domain/draft';
import { useDraftFromAnswers } from '@/features/ai/queries';
import { useCreateDraft } from '@/features/drafts/queries';
import { haptics } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/reduced-motion';
import { toast } from '@/stores/toast';
import { duration, layout, radius, space, useTheme } from '@/theme';

type Phase = 'idle' | 'listening' | 'heard' | 'typing';

const DRAFTING_STEPS = ['Writing a title and summary', 'Structuring your story', 'Suggesting who to reach', 'Drafting ad copy'];
/** Characters revealed per tick of the demo transcript. */
const CHARS_PER_TICK = 2;
const TICK_MS = 28;

/**
 * Create with your voice (demo). Four guided questions; a sample transcript is typed out as if
 * spoken (speech recognition isn't available in Expo Go), or the creator types their own answer.
 * Demo AI then drafts the campaign and opens it on Step 1 for editing. AI never sets the goal.
 */
export default function VoiceScreen() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const draftFromAnswers = useDraftFromAnswers();
  const createDraft = useCreateDraft();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
  const [phase, setPhase] = useState<Phase>('idle');
  const [shown, setShown] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [draftingStep, setDraftingStep] = useState(0);

  const question = VOICE_QUESTIONS[index];
  const answer = answers[index];
  const setAnswer = (text: string) => setAnswers((a) => a.map((x, i) => (i === index ? text : x)));

  // Type the demo transcript out while "listening". With reduced motion, it appears whole once
  // the same listening time has passed.
  useEffect(() => {
    if (phase !== 'listening') return;
    const full = DEMO_TRANSCRIPTS[index];
    const finish = () => {
      setShown(full.length);
      setPhase('heard');
      haptics.success();
    };
    if (reduced) {
      const timer = setTimeout(finish, Math.ceil(full.length / CHARS_PER_TICK) * TICK_MS);
      return () => clearTimeout(timer);
    }
    let count = 0;
    const timer = setInterval(() => {
      count = Math.min(full.length, count + CHARS_PER_TICK);
      setShown(count);
      if (count >= full.length) {
        clearInterval(timer);
        finish();
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [phase, index, reduced]);

  // Cycle the "what AI is doing" line while drafting.
  useEffect(() => {
    if (!drafting) return;
    const timer = setInterval(() => setDraftingStep((s) => (s + 1) % DRAFTING_STEPS.length), 700);
    return () => clearInterval(timer);
  }, [drafting]);

  const goToQuestion = (i: number) => {
    setIndex(i);
    setShown(0);
    setPhase(answers[i] ? 'heard' : 'idle');
  };

  // Android back returns to the previous question before leaving.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drafting) return true;
      if (index > 0) {
        goToQuestion(index - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });

  const startListening = () => {
    if (phase === 'listening') {
      // Stop early: keep what has been "heard" so far.
      setAnswer(DEMO_TRANSCRIPTS[index].slice(0, shown));
      setPhase('heard');
      return;
    }
    setShown(0);
    setAnswer(DEMO_TRANSCRIPTS[index]);
    setPhase('listening');
  };

  const next = async () => {
    if (!answer.trim()) return;
    if (index < VOICE_QUESTIONS.length - 1) {
      goToQuestion(index + 1);
      return;
    }
    setDrafting(true);
    try {
      const patch = await draftFromAnswers.mutateAsync(answers.map((a) => a.trim()) as VoiceAnswers);
      const draft = await createDraft.mutateAsync({ origin: 'voice', patch });
      haptics.success();
      router.replace({ pathname: '/draft/[id]', params: { id: draft.id, fromVoice: '1' } });
    } catch {
      setDrafting(false);
      toast('Couldn’t draft your campaign. Your answers are kept; try again.', 'error');
    }
  };

  const transcript = phase === 'listening' ? DEMO_TRANSCRIPTS[index].slice(0, shown) : answer;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ gestureEnabled: !drafting }} />
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: insets.top + space.sm }]}>
        <View style={styles.side}>
          {index > 0 && !drafting && (
            <IconButton icon={ArrowLeftIcon} accessibilityLabel="Previous question" variant="tinted" size={36} onPress={() => goToQuestion(index - 1)} />
          )}
        </View>
        <View style={styles.titles}>
          <Text variant="title3" align="center">
            Create with your voice
          </Text>
          <Text variant="caption" color="textMuted" align="center">
            {drafting ? 'Drafting' : `Question ${index + 1} of ${VOICE_QUESTIONS.length}`}
          </Text>
        </View>
        <View style={[styles.side, styles.right]}>
          <IconButton icon={XIcon} accessibilityLabel="Close" variant="tinted" size={36} disabled={drafting} onPress={() => router.back()} />
        </View>
      </View>
      <View style={styles.progress}>
        {VOICE_QUESTIONS.map((q, i) => (
          <View key={q.prompt} style={[styles.segment, { backgroundColor: i <= index || drafting ? colors.primary : colors.surfaceSunken }]} />
        ))}
      </View>

      {drafting ? (
        <Animated.View entering={FadeIn.duration(duration.slow)} style={styles.drafting}>
          <Card style={styles.draftCard}>
            <View style={styles.draftHeader}>
              <SparkleIcon size={20} color={colors.primary} weight="fill" />
              <Animated.View key={draftingStep} entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)} style={styles.flex}>
                <Text variant="bodyStrong">{`${DRAFTING_STEPS[draftingStep]}…`}</Text>
              </Animated.View>
            </View>
            <SkeletonGroup style={styles.shimmer} label="Drafting your campaign">
              <Skeleton width="70%" height={20} />
              <Skeleton height={12} />
              <Skeleton height={12} />
              <Skeleton width="85%" height={12} />
              <Skeleton height={120} radius={radius.md} style={{ marginTop: space.sm }} />
            </SkeletonGroup>
          </Card>
          <Text variant="footnote" color="textMuted" align="center">
            AI drafts the basics, story, ad copy and audience. You’ll set the funding goal yourself.
          </Text>
        </Animated.View>
      ) : (
        <StepLayout
          footer={
            <View style={styles.footer}>
              <Button
                label={phase === 'typing' ? 'Use the microphone' : 'Type instead'}
                variant="secondary"
                icon={phase === 'typing' ? undefined : KeyboardIcon}
                onPress={() => setPhase(phase === 'typing' ? (answer ? 'heard' : 'idle') : 'typing')}
              />
              <Button
                label={index === VOICE_QUESTIONS.length - 1 ? 'Draft my campaign' : 'Next'}
                icon={index === VOICE_QUESTIONS.length - 1 ? SparkleIcon : undefined}
                style={styles.primary}
                disabled={!answer.trim() || phase === 'listening'}
                onPress={() => void next()}
              />
            </View>
          }>
            <Animated.View key={index} entering={FadeInRight.duration(duration.slow)} style={styles.question}>
              <Text variant="hero" accessibilityRole="header">
                {question.prompt}
              </Text>
              <Text variant="body" color="textMuted">
                {question.hint}
              </Text>
            </Animated.View>

            {phase === 'typing' ? (
              <TextField label="Your answer" multiline value={answer} onChangeText={setAnswer} autoFocus placeholder="Type your answer" />
            ) : (
              <View style={[styles.transcript, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityLiveRegion="polite">
                {transcript ? (
                  <Text variant="storyBody">
                    {transcript}
                    {phase === 'listening' && <Text variant="storyBody" color="primary">▍</Text>}
                  </Text>
                ) : (
                  <Text variant="body" color="textMuted">
                    Tap the microphone and answer out loud.
                  </Text>
                )}
              </View>
            )}

            {phase !== 'typing' && (
              <View style={styles.micArea}>
                <Waveform active={phase === 'listening'} />
                <MicButton listening={phase === 'listening'} onPress={startListening} />
                <Text variant="footnote" color="textMuted">
                  {phase === 'listening' ? 'Listening… tap to stop' : phase === 'heard' ? 'Tap to answer again' : 'Tap to answer'}
                </Text>
              </View>
            )}

            <View style={[styles.notice, { backgroundColor: colors.surfaceSunken }]}>
              <Text variant="footnote" color="textMuted" style={styles.flex}>
                Speech recognition isn’t available in this prototype, so a sample answer is typed for you. Use “Type instead” for your own words.
              </Text>
            </View>
        </StepLayout>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md, gap: space.sm },
  side: { width: 44 },
  right: { alignItems: 'flex-end' },
  titles: { flex: 1, gap: 2 },
  progress: { flexDirection: 'row', gap: space.xs, paddingHorizontal: space.xl },
  segment: { flex: 1, height: 4, borderRadius: radius.pill },
  question: { gap: space.sm },
  transcript: { minHeight: 140, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: space.lg },
  micArea: { alignItems: 'center', gap: space.xs },
  notice: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
  footer: { flexDirection: 'row', gap: space.sm },
  primary: { flex: 1, alignSelf: 'auto' },
  drafting: { flex: 1, justifyContent: 'center', padding: layout.gutter, gap: space.lg },
  draftCard: { gap: space.lg },
  draftHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  shimmer: { gap: space.sm },
});
