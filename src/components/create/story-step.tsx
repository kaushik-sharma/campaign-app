import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SourceList } from '@/components/campaign/detail/source-list';
import { StoryRenderer } from '@/components/campaign/detail/story-renderer';
import { SuggestedActions } from '@/components/campaign/detail/suggested-actions';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { blockTypeLabels, emptyBlock, publishableBlocks } from '@/domain/draft';
import type { StoryBlock, StoryBlockType } from '@/domain/types';
import { fonts, layout, radius, space, useTheme } from '@/theme';

import { BlockEditor, blockIcons, blockLayout } from './block-editor';
import { FieldMessage, StepIntro, type StepProps } from './form';
import { SourcesManager } from './sources-manager';

const BLOCK_HINTS: Record<StoryBlockType, string> = {
  headline: 'A large line to open a section',
  intro: 'The opening lines, in italics',
  heading: 'A section title',
  paragraph: 'Body text with bold, italic and links',
  image: 'A photo with caption and credit',
  stat: 'A key figure that cites a source',
  quote: 'Someone’s words, with attribution',
  actions: 'What readers can do next',
};

const ADDABLE: StoryBlockType[] = ['paragraph', 'heading', 'image', 'stat', 'quote', 'headline', 'intro', 'actions'];

function AddBlockSheet({ open, onClose, onAdd, hasActions }: { open: boolean; onClose: () => void; onAdd: (t: StoryBlockType) => void; hasActions: boolean }) {
  const { colors } = useTheme();
  return (
    <Sheet open={open} onClose={onClose} title="Add a block">
      <View style={styles.grid}>
        {ADDABLE.filter((t) => t !== 'actions' || !hasActions).map((type) => {
          const Icon = blockIcons[type];
          return (
            <PressableScale
              key={type}
              onPress={() => onAdd(type)}
              haptic="selection"
              scaleTo={0.96}
              accessibilityLabel={`${blockTypeLabels[type]}: ${BLOCK_HINTS[type]}`}
              style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
              <Icon size={20} color={colors.primary} weight="bold" />
              <Text variant="subhead">{blockTypeLabels[type]}</Text>
              <Text variant="caption" color="textMuted">
                {BLOCK_HINTS[type]}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
}

/**
 * Story composer. Blocks can be added, edited, moved and removed (with layout animation); the
 * Preview tab renders the exact components the published page uses.
 */
export function StoryStep({
  draft,
  update,
  errors,
  previewing,
  onPreviewingChange,
}: StepProps & { previewing: boolean; onPreviewingChange: (on: boolean) => void }) {
  const { colors } = useTheme();
  const { blocks, sources } = draft.story;
  const mode = previewing ? 'preview' : 'edit';
  const [adding, setAdding] = useState(false);

  const setBlocks = (recipe: (b: StoryBlock[]) => StoryBlock[]) =>
    update((d) => ({ ...d, story: { ...d.story, blocks: recipe(d.story.blocks) } }));

  const move = (index: number, dir: -1 | 1) =>
    setBlocks((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + dir, 0, item);
      return next;
    });

  const actions = blocks.flatMap((b) => (b.type === 'actions' ? b.items.filter((i) => i.trim()) : []));
  const cited = blocks.flatMap((b) => (b.type === 'stat' && b.sourceId ? [b.sourceId] : []));

  return (
    <View style={styles.root}>
      <StepIntro title="Story" body="Tell the full message. Back every claim with a source readers can check." />

      <SegmentedControl<'edit' | 'preview'>
        accessibilityLabel="Edit or preview the story"
        value={mode}
        onChange={(m) => onPreviewingChange(m === 'preview')}
        options={[
          { value: 'edit', label: 'Edit' },
          { value: 'preview', label: 'Preview' },
        ]}
      />

      {mode === 'preview' ? (
        <Animated.View key="preview" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={[styles.preview, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text variant="storyTitle">{draft.basics.title || 'Your title'}</Text>
          {draft.basics.summary ? (
            <Text variant="storyBody" color="textMuted" style={styles.lede}>
              {draft.basics.summary}
            </Text>
          ) : null}
          <View style={styles.bleed}>
            <StoryRenderer blocks={publishableBlocks(blocks)} sources={sources} />
          </View>
          {actions.length > 0 && (
            <View style={styles.previewSection}>
              <Text variant="title2">What you can do</Text>
              <SuggestedActions actions={actions} />
            </View>
          )}
          <View style={styles.previewSection}>
            <Text variant="title2">Sources</Text>
            <SourceList sources={sources} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="edit" entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={styles.root}>
          <View style={styles.blocks}>
            {blocks.map((block, i) => (
              <Animated.View key={block.id} layout={blockLayout} entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)}>
                <BlockEditor
                  block={block}
                  index={i}
                  count={blocks.length}
                  sources={sources}
                  category={draft.basics.category}
                  errors={errors}
                  onChange={(next) => setBlocks((list) => list.map((b) => (b.id === block.id ? next : b)))}
                  onMove={(dir) => move(i, dir)}
                  onRemove={() => setBlocks((list) => list.filter((b) => b.id !== block.id))}
                />
              </Animated.View>
            ))}
            <Animated.View layout={blockLayout}>
              <FieldMessage error={errors['story.blocks']} />
              <Button
                label="Add block"
                variant="secondary"
                icon={PlusIcon}
                fullWidth
                disabled={blocks.length >= demo.creation.maxStoryBlocks}
                onPress={() => setAdding(true)}
              />
            </Animated.View>
          </View>

          <View style={styles.sources}>
            <Text variant="title3" accessibilityRole="header">
              Sources
              <Text variant="title3" color="danger">{' *'}</Text>
            </Text>
            <Text variant="footnote" color="textMuted">
              Reviewers check that your story matches these, and readers see them under your story.
            </Text>
            <SourcesManager
              sources={sources}
              citedIds={cited}
              error={errors['story.sources']}
              onChange={(next) => update((d) => ({ ...d, story: { ...d.story, sources: next } }))}
            />
          </View>
        </Animated.View>
      )}

      <AddBlockSheet
        open={adding}
        onClose={() => setAdding(false)}
        hasActions={blocks.some((b) => b.type === 'actions')}
        onAdd={(type) => {
          setBlocks((list) => [...list, emptyBlock(type)]);
          setAdding(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xxl },
  blocks: { gap: space.md },
  sources: { gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '48.5%', padding: space.md, borderRadius: radius.md, gap: 4 },
  preview: { gap: space.lg, paddingVertical: space.xl, paddingHorizontal: layout.gutter, marginHorizontal: -layout.gutter, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  lede: { fontFamily: fonts.serifItalic },
  bleed: { marginHorizontal: -layout.gutter },
  previewSection: { gap: space.md, marginTop: space.lg },
});
