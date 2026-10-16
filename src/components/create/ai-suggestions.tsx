import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MagicWandIcon, SparkleIcon } from '@/components/ui/icons';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { categoryLabel } from '@/domain/categories';
import type { BasicsSuggestion } from '@/domain/draft';
import type { CategoryId } from '@/domain/types';
import { duration, radius, space, spring, useTheme } from '@/theme';

const FIELD_LABELS: Record<BasicsSuggestion['field'], string> = { title: 'Title', summary: 'Summary', category: 'Category' };

const layout = LinearTransition.springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness);

type Props = {
  thinking: boolean;
  /** null until the creator asks for suggestions. */
  suggestions: BasicsSuggestion[] | null;
  onRequest: () => void;
  onAccept: (s: BasicsSuggestion) => void;
  onEdit: (s: BasicsSuggestion) => void;
  onDismiss: (s: BasicsSuggestion) => void;
};

/**
 * "Suggest with AI (demo)": a shimmer while it thinks, then one card per suggestion to accept,
 * accept and edit, or dismiss. AI only ever proposes; nothing changes until the creator chooses.
 */
export function AiSuggestions({ thinking, suggestions, onRequest, onAccept, onEdit, onDismiss }: Props) {
  const { colors } = useTheme();
  return (
    <Animated.View layout={layout}>
      <Card tone="sunken" elevation="e0" style={styles.card}>
        <View style={styles.header}>
          <SparkleIcon size={18} color={colors.primary} weight="fill" />
          <Text variant="subhead" style={styles.flex}>
            Suggest with AI
          </Text>
        </View>

        {thinking ? (
          <Animated.View key="thinking" entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)}>
            <SkeletonGroup style={styles.shimmer} label="AI is thinking">
              <Skeleton width="35%" height={10} />
              <Skeleton height={14} />
              <Skeleton width="80%" height={14} />
              <Skeleton width="55%" height={10} radius={radius.xs} />
            </SkeletonGroup>
          </Animated.View>
        ) : suggestions === null ? (
          <Text variant="footnote" color="textMuted">
            Get suggestions for your title, summary and category based on what you’ve written. You decide what to keep.
          </Text>
        ) : suggestions.length === 0 ? (
          <Text variant="footnote" color="textMuted">
            No more suggestions. Your basics look good.
          </Text>
        ) : (
          <View style={styles.list}>
            {suggestions.map((s) => (
              <Animated.View
                key={s.id}
                entering={FadeIn.duration(duration.base)}
                exiting={FadeOut.duration(duration.fast)}
                layout={layout}
                style={[styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text variant="overline" color="textMuted">
                  {FIELD_LABELS[s.field]}
                </Text>
                <Text variant="body">{s.field === 'category' ? categoryLabel(s.value as CategoryId) : s.value}</Text>
                <Text variant="footnote" color="textMuted">
                  {s.reason}
                </Text>
                <View style={styles.actions}>
                  <Button label="Accept" size="sm" onPress={() => onAccept(s)} />
                  {s.field !== 'category' && <Button label="Edit" size="sm" variant="secondary" onPress={() => onEdit(s)} />}
                  <Button label="Dismiss" size="sm" variant="ghost" onPress={() => onDismiss(s)} />
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {!thinking && (
          <Button
            label={suggestions === null ? 'Suggest with AI' : 'Suggest again'}
            size="sm"
            variant="secondary"
            icon={MagicWandIcon}
            onPress={onRequest}
          />
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  shimmer: { gap: space.sm },
  list: { gap: space.sm },
  suggestion: { gap: space.xs, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
});
