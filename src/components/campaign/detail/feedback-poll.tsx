import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { CheckCircleIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { useCampaignFeedback, useSubmitFeedback } from '@/features/campaigns/queries';
import type { CampaignFeedback, FeedbackAnswer } from '@/domain/types';
import { describeError } from '@/services';
import { toast } from '@/stores/toast';
import { duration, space, useTheme } from '@/theme';

const OPTIONS: { value: FeedbackAnswer; label: string }[] = [
  { value: 'no', label: 'No' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'yes', label: 'Yes' },
];

const QUESTIONS: { key: keyof CampaignFeedback; text: string }[] = [
  { key: 'visualsEncouraged', text: 'Did the visuals make you want to keep reading?' },
  { key: 'changedMind', text: 'Did this message change your mind?' },
];

/** Two quick questions that help creators improve. Anonymous; answered once per campaign. */
export function FeedbackPoll({ campaignId }: { campaignId: string }) {
  const { colors } = useTheme();
  const existing = useCampaignFeedback(campaignId);
  const submit = useSubmitFeedback(campaignId);
  const [answers, setAnswers] = useState<Partial<CampaignFeedback>>({});

  if (existing.isPending) return null;

  if (existing.data) {
    return (
      <Animated.View entering={FadeIn.duration(duration.slow)}>
        <Card tone="sunken" style={styles.thanks}>
          <CheckCircleIcon size={22} color={colors.success} weight="fill" />
          <Text variant="subhead" color="textMuted" style={styles.flex}>
            Thanks for your feedback. Answers are anonymous and shared with the creator only as totals.
          </Text>
        </Card>
      </Animated.View>
    );
  }

  const complete = answers.visualsEncouraged && answers.changedMind;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="title3" accessibilityRole="header">
          Help the creator improve
        </Text>
        <Text variant="subhead" color="textMuted">
          Two quick questions. Anonymous.
        </Text>
      </View>
      {QUESTIONS.map((q) => (
        <View key={q.key} style={styles.question} accessibilityRole="radiogroup" accessibilityLabel={q.text}>
          <Text variant="body">{q.text}</Text>
          <View style={styles.options}>
            {OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={answers[q.key] === o.value}
                onPress={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))}
              />
            ))}
          </View>
        </View>
      ))}
      <Button
        label="Send feedback"
        variant="secondary"
        disabled={!complete}
        loading={submit.isPending}
        onPress={() => {
          if (!complete) return;
          submit.mutate(answers as CampaignFeedback, {
            onError: (e) => toast(describeError(e).message, 'error'),
          });
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.xl },
  header: { gap: 2 },
  question: { gap: space.sm },
  options: { flexDirection: 'row', gap: space.sm },
  thanks: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
});
