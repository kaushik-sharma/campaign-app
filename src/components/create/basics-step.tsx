import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { demo } from '@/config/demo';
import { categories, creatorTypeLabels } from '@/domain/categories';
import type { BasicsSuggestion } from '@/domain/draft';
import type { CategoryId, CreatorType } from '@/domain/types';
import { useGenerateImages, useSuggestBasics } from '@/features/ai/queries';
import { stripInline } from '@/lib/inline-format';
import { toast } from '@/stores/toast';
import { space } from '@/theme';

import { AiSuggestions } from './ai-suggestions';
import { ChipSelect, FieldGroup, StepIntro, type StepProps } from './form';
import { MediaField } from './media-field';

const CREATOR_TYPES = Object.entries(creatorTypeLabels).map(([value, label]) => ({ value: value as CreatorType, label }));

export function BasicsStep({ draft, update, errors }: StepProps) {
  const { basics } = draft;
  const suggest = useSuggestBasics();
  const generate = useGenerateImages();
  const [suggestions, setSuggestions] = useState<BasicsSuggestion[] | null>(null);
  const titleRef = useRef<TextInput>(null);
  const summaryRef = useRef<TextInput>(null);

  const setBasics = (patch: Partial<typeof basics>) => update((d) => ({ ...d, basics: { ...d.basics, ...patch } }));

  const requestSuggestions = () => {
    const storyText = draft.story.blocks
      .map((b) => ('text' in b ? stripInline(b.text) : ''))
      .join(' ')
      .trim();
    suggest.mutate(
      { title: basics.title, summary: basics.summary, category: basics.category, storyText },
      {
        onSuccess: setSuggestions,
        onError: () => toast('Couldn’t get suggestions. Try again.', 'error'),
      },
    );
  };

  const apply = (s: BasicsSuggestion) => {
    if (s.field === 'category') setBasics({ category: s.value as CategoryId });
    else setBasics({ [s.field]: s.value });
    setSuggestions((list) => list?.filter((x) => x.id !== s.id) ?? null);
  };

  return (
    <View style={styles.root}>
      <StepIntro title="Basics" body="The essentials people see first: what it’s about and who it’s from." />

      <TextField
        ref={titleRef}
        label="Title"
        required
        value={basics.title}
        onChangeText={(title) => setBasics({ title })}
        maxLength={demo.creation.titleMax}
        error={errors['basics.title']}
        helper="May also be used as your ad headline."
        placeholder="e.g. Shade cools our hottest blocks"
      />

      <AiSuggestions
        thinking={suggest.isPending}
        suggestions={suggestions}
        onRequest={requestSuggestions}
        onAccept={(s) => {
          apply(s);
          toast(`${s.field[0].toUpperCase()}${s.field.slice(1)} updated`, 'success');
        }}
        onEdit={(s) => {
          apply(s);
          (s.field === 'title' ? titleRef : summaryRef).current?.focus();
        }}
        onDismiss={(s) => setSuggestions((list) => list?.filter((x) => x.id !== s.id) ?? null)}
      />

      <FieldGroup label="Category" required error={errors['basics.category']}>
        <ChipSelect
          options={categories.map((c) => ({ value: c.id, label: c.label }))}
          selected={basics.category ? [basics.category] : []}
          onToggle={(category) => setBasics({ category })}
        />
      </FieldGroup>

      <TextField
        label="Creator or organisation name"
        required
        value={basics.creatorName}
        onChangeText={(creatorName) => setBasics({ creatorName })}
        maxLength={60}
        error={errors['basics.creatorName']}
        helper="Shown on the campaign as who it’s from."
        autoComplete="name"
      />

      <FieldGroup label="Created by" required error={errors['basics.creatorType']}>
        <ChipSelect options={CREATOR_TYPES} selected={basics.creatorType ? [basics.creatorType] : []} onToggle={(creatorType) => setBasics({ creatorType })} />
      </FieldGroup>

      <TextField
        ref={summaryRef}
        label="Summary"
        required
        multiline
        value={basics.summary}
        onChangeText={(summary) => setBasics({ summary })}
        maxLength={demo.creation.summaryMax}
        error={errors['basics.summary']}
        helper={`One or two sentences, at least ${demo.creation.summaryMin} characters. Shown on cards and under the title.`}
      />

      <FieldGroup label="Cover image" required error={errors['basics.cover']} helper="Shown on cards and at the top of your campaign. Landscape works best.">
        <MediaField
          asset={basics.cover}
          role="cover"
          onChange={(cover) => setBasics({ cover })}
          onGenerate={async () => (await generate.mutateAsync({ category: basics.category, count: 1 }))[0] ?? null}
        />
      </FieldGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xxl },
});
