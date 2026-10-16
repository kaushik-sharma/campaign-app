import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatCircleTextIcon,
  HashIcon,
  ImageSquareIcon,
  LinkSimpleIcon,
  ListChecksIcon,
  MagicWandIcon,
  ParagraphIcon,
  PlusIcon,
  TextAaIcon,
  TextBIcon,
  TextHIcon,
  TextItalicIcon,
  TrashIcon,
  XIcon,
  type IconComponent,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { blockTypeLabels, imageUri, type FieldErrors } from '@/domain/draft';
import type { CategoryId, Source, StoryBlock, StoryBlockType } from '@/domain/types';
import { useGenerateImages } from '@/features/ai/queries';
import { pickMedia } from '@/features/drafts/media';
import { toast } from '@/stores/toast';
import { duration, radius, space, useTheme } from '@/theme';

import { FieldMessage } from './form';

export const blockIcons: Record<StoryBlockType, IconComponent> = {
  headline: TextAaIcon,
  intro: ParagraphIcon,
  heading: TextHIcon,
  paragraph: ParagraphIcon,
  image: ImageSquareIcon,
  stat: HashIcon,
  quote: ChatCircleTextIcon,
  actions: ListChecksIcon,
};

type Selection = { start: number; end: number };

/** Wraps the selection (or inserts a placeholder) with inline markup. */
function wrap(text: string, sel: Selection, before: string, after: string, placeholder: string) {
  const selected = text.slice(sel.start, sel.end) || placeholder;
  return text.slice(0, sel.start) + before + selected + after + text.slice(sel.end);
}

function ToolbarButton({ icon: Icon, label, onPress, active }: { icon: IconComponent; label: string; onPress: () => void; active?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.9}
      accessibilityLabel={label}
      style={[styles.toolButton, { backgroundColor: active ? colors.primarySoft : colors.surfaceSunken }]}>
      <Icon size={16} color={active ? colors.primary : colors.text} weight="bold" />
    </PressableScale>
  );
}

/** Paragraph editor with a bold / italic / link toolbar that writes lightweight markup. */
function ParagraphEditor({ text, onChange, error }: { text: string; onChange: (text: string) => void; error?: string }) {
  const [selection, setSelection] = useState<Selection>({ start: text.length, end: text.length });
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('https://');
  const [urlError, setUrlError] = useState<string | null>(null);

  const insertLink = () => {
    if (!/^https?:\/\/[^\s.]+\.[^\s]+$/.test(url.trim())) {
      setUrlError('Enter a full link, e.g. https://example.org/page');
      return;
    }
    onChange(wrap(text, selection, '[', `](${url.trim()})`, 'link text'));
    setLinkOpen(false);
    setUrl('https://');
    setUrlError(null);
  };

  return (
    <View style={styles.paragraph}>
      <View style={styles.toolbar} accessibilityRole="toolbar">
        <ToolbarButton icon={TextBIcon} label="Bold" onPress={() => onChange(wrap(text, selection, '**', '**', 'bold text'))} />
        <ToolbarButton icon={TextItalicIcon} label="Italic" onPress={() => onChange(wrap(text, selection, '_', '_', 'italic text'))} />
        <ToolbarButton icon={LinkSimpleIcon} label="Link" active={linkOpen} onPress={() => setLinkOpen((o) => !o)} />
        <Text variant="caption" color="textMuted" style={styles.toolHint}>
          Select text, then format
        </Text>
      </View>
      <TextField
        label="Paragraph"
        multiline
        value={text}
        onChangeText={onChange}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        error={error}
      />
      {linkOpen && (
        <Animated.View entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)} style={styles.linkForm}>
          <TextField
            label="Link address"
            value={url}
            onChangeText={(v) => {
              setUrl(v);
              setUrlError(null);
            }}
            error={urlError ?? undefined}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
            onSubmitEditing={insertLink}
          />
          <View style={styles.row}>
            <Button label="Add link" size="sm" onPress={insertLink} />
            <Button label="Cancel" size="sm" variant="ghost" onPress={() => setLinkOpen(false)} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function StoryImageEditor({
  block,
  onChange,
  category,
  errors,
}: {
  block: Extract<StoryBlock, { type: 'image' }>;
  onChange: (b: StoryBlock) => void;
  category: CategoryId | null;
  errors: (field: string) => string | undefined;
}) {
  const { colors } = useTheme();
  const generate = useGenerateImages();
  const has = imageUri(block.image);

  const pick = async () => {
    const result = await pickMedia('image', 'story');
    if (result.status === 'rejected') toast(`Can’t use this image: ${result.checks.find((c) => c.status === 'error')?.label}`, 'error');
    if (result.status === 'picked') onChange({ ...block, image: { ...result.asset.image, alt: block.image.alt } });
  };
  const gen = () =>
    generate.mutate(
      { category, count: 1 },
      {
        onSuccess: ([asset]) => asset && onChange({ ...block, image: { ...asset.image, alt: block.image.alt || asset.image.alt } }),
        onError: () => toast('Couldn’t generate an image. Try again.', 'error'),
      },
    );

  return (
    <View style={styles.fields}>
      {has ? (
        <Image source={block.image.source} contentFit="cover" style={[styles.storyImage, { backgroundColor: colors.surfaceSunken }]} />
      ) : (
        <View style={[styles.imageEmpty, { borderColor: errors('image') ? colors.danger : colors.borderStrong }]}>
          <ImageSquareIcon size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.row}>
        <Button label={has ? 'Replace' : 'Choose photo'} size="sm" variant="secondary" onPress={() => void pick()} />
        <Button label="Generate with AI" size="sm" variant="ghost" icon={MagicWandIcon} loading={generate.isPending} onPress={gen} />
      </View>
      <FieldMessage error={errors('image')} />
      <TextField
        label="Image description"
        required
        value={block.image.alt}
        onChangeText={(alt) => onChange({ ...block, image: { ...block.image, alt } })}
        error={errors('alt')}
        helper="Read aloud by screen readers. Describe what the image shows."
      />
      <TextField label="Caption" value={block.caption ?? ''} onChangeText={(caption) => onChange({ ...block, caption })} />
      <TextField
        label="Credit"
        value={block.image.credit ?? ''}
        onChangeText={(credit) => onChange({ ...block, image: { ...block.image, credit } })}
        placeholder="e.g. Photo by Jane Doe"
      />
    </View>
  );
}

type Props = {
  block: StoryBlock;
  index: number;
  count: number;
  sources: Source[];
  category: CategoryId | null;
  errors: FieldErrors;
  onChange: (b: StoryBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

/** One story block: type header with move / remove, and the fields for its type. */
export function BlockEditor({ block, index, count, sources, category, errors, onChange, onMove, onRemove }: Props) {
  const { colors } = useTheme();
  const Icon = blockIcons[block.type];
  const err = (field: string) => errors[`story.blocks.${block.id}.${field}`];

  let body: React.ReactNode;
  switch (block.type) {
    case 'headline':
    case 'intro':
    case 'heading':
      body = (
        <TextField
          label={blockTypeLabels[block.type]}
          multiline={block.type === 'intro'}
          value={block.text}
          onChangeText={(text) => onChange({ ...block, text })}
          error={err('text')}
          helper={block.type === 'intro' ? 'The opening lines, shown in italics.' : undefined}
        />
      );
      break;
    case 'paragraph':
      body = <ParagraphEditor text={block.text} onChange={(text) => onChange({ ...block, text })} error={err('text')} />;
      break;
    case 'image':
      body = <StoryImageEditor block={block} onChange={onChange} category={category} errors={err} />;
      break;
    case 'stat':
      body = (
        <View style={styles.fields}>
          <TextField label="Figure" required value={block.value} onChangeText={(value) => onChange({ ...block, value })} error={err('value')} placeholder="e.g. 40%" />
          <TextField label="What it measures" required value={block.label} onChangeText={(label) => onChange({ ...block, label })} error={err('label')} />
          <View style={styles.fields}>
            <Text variant="subhead">
              Source<Text variant="subhead" color="danger">{' *'}</Text>
            </Text>
            {sources.length === 0 ? (
              <Text variant="footnote" color="textMuted">
                Add a source below, then choose it here.
              </Text>
            ) : (
              <View style={styles.chips}>
                {sources.map((s, i) => (
                  <Chip key={s.id} label={`[${i + 1}] ${s.title.length > 28 ? `${s.title.slice(0, 27)}…` : s.title}`} selected={block.sourceId === s.id} onPress={() => onChange({ ...block, sourceId: s.id })} />
                ))}
              </View>
            )}
            <FieldMessage error={err('source')} />
          </View>
        </View>
      );
      break;
    case 'quote':
      body = (
        <View style={styles.fields}>
          <TextField label="Quote" required multiline value={block.text} onChangeText={(text) => onChange({ ...block, text })} error={err('text')} />
          <TextField label="Who said it" value={block.attribution ?? ''} onChangeText={(attribution) => onChange({ ...block, attribution })} />
        </View>
      );
      break;
    case 'actions':
      body = (
        <View style={styles.fields}>
          <Text variant="footnote" color="textMuted">
            Shown as “What you can do” after your story.
          </Text>
          {block.items.map((item, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.flex}>
                <TextField
                  label={`Action ${i + 1}`}
                  value={item}
                  onChangeText={(v) => onChange({ ...block, items: block.items.map((x, j) => (j === i ? v : x)) })}
                  maxLength={90}
                />
              </View>
              {block.items.length > 1 && (
                <IconButton icon={XIcon} accessibilityLabel={`Remove action ${i + 1}`} size={32} onPress={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} style={styles.removeAction} />
              )}
            </View>
          ))}
          {block.items.length < 5 && (
            <Button label="Add action" size="sm" variant="ghost" icon={PlusIcon} onPress={() => onChange({ ...block, items: [...block.items, ''] })} />
          )}
          <FieldMessage error={err('items')} />
        </View>
      );
      break;
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.typeIcon, { backgroundColor: colors.surfaceSunken }]}>
          <Icon size={14} color={colors.textMuted} weight="bold" />
        </View>
        <Text variant="overline" color="textMuted" style={styles.flex}>
          {blockTypeLabels[block.type]}
        </Text>
        <IconButton icon={ArrowUpIcon} accessibilityLabel="Move block up" size={32} disabled={index === 0} onPress={() => onMove(-1)} />
        <IconButton icon={ArrowDownIcon} accessibilityLabel="Move block down" size={32} disabled={index === count - 1} onPress={() => onMove(1)} />
        <IconButton icon={TrashIcon} accessibilityLabel={`Remove ${blockTypeLabels[block.type].toLowerCase()} block`} size={32} onPress={onRemove} />
      </View>
      {body}
    </Card>
  );
}

export const blockLayout = LinearTransition.duration(duration.slow);

const styles = StyleSheet.create({
  card: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: -space.xs },
  typeIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: space.xs },
  flex: { flex: 1 },
  fields: { gap: space.md },
  paragraph: { gap: space.sm },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  toolButton: { width: 36, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  toolHint: { marginLeft: space.sm },
  linkForm: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  storyImage: { width: '100%', aspectRatio: 3 / 2, borderRadius: radius.md },
  imageEmpty: { aspectRatio: 3 / 2, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  removeAction: { marginBottom: 8 },
});
