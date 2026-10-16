import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CoverImage } from '@/components/campaign/cover-image';
import { IconButton } from '@/components/ui/icon-button';
import { TrashIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { DRAFT_STEPS, draftStepLabels, type DraftSummary } from '@/domain/draft';
import { formatRelative } from '@/lib/format';
import { layout, motion, radius, space } from '@/theme';

/** A resumable draft: where it stopped and when it was last saved. */
export function DraftRow({ draft, onDelete }: { draft: DraftSummary; onDelete: () => void }) {
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: layout.cardPadding, paddingRight: space.sm, paddingVertical: space.md },
  rowText: { flex: 1, gap: 2 },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
});
