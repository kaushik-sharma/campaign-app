import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { IconButton } from '@/components/ui/icon-button';
import { PencilSimpleIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { newId, validateSource, type FieldErrors } from '@/domain/draft';
import type { Source } from '@/domain/types';
import { domainOf } from '@/lib/format';
import { duration, layout, space } from '@/theme';

import { FieldMessage } from './form';

type Props = {
  sources: Source[];
  onChange: (sources: Source[]) => void;
  /** Ids of sources cited by statistics, so removing one can warn. */
  citedIds: string[];
  error?: string;
};

function SourceForm({ initial, onSave, onCancel }: { initial?: Source; onSave: (s: Source) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? 'https://');
  const [publisher, setPublisher] = useState(initial?.publisher ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = () => {
    const found = validateSource({ title, url: url.trim() });
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave({ id: initial?.id ?? newId('s_'), title: title.trim(), url: url.trim(), publisher: publisher.trim() || domainOf(url.trim()) });
  };

  return (
    <Animated.View entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)} style={styles.form}>
      <TextField label="Title" required value={title} onChangeText={setTitle} error={errors.title} placeholder="e.g. Heat Island Effect" />
      <TextField
        label="Link"
        required
        value={url}
        onChangeText={setUrl}
        error={errors.url}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        helper="The page readers can open to check your claim."
      />
      <TextField label="Publisher" value={publisher} onChangeText={setPublisher} helper="Optional. Defaults to the website’s name." />
      <View style={styles.row}>
        <Button label={initial ? 'Save source' : 'Add source'} size="sm" onPress={save} />
        <Button label="Cancel" size="sm" variant="ghost" onPress={onCancel} />
      </View>
    </Animated.View>
  );
}

/** Sources readers can check. Statistics must cite one; numbering matches the published list. */
export function SourcesManager({ sources, onChange, citedIds, error }: Props) {
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  return (
    <Animated.View layout={LinearTransition.duration(duration.base)} style={styles.root}>
      {sources.length > 0 && (
        <Card padded={false}>
          {sources.map((s, i) => (
            <View key={s.id}>
              {i > 0 && <Divider inset={layout.cardPadding} />}
              {editing === s.id ? (
                <View style={styles.editing}>
                  <SourceForm
                    initial={s}
                    onCancel={() => setEditing(null)}
                    onSave={(next) => {
                      onChange(sources.map((x) => (x.id === s.id ? next : x)));
                      setEditing(null);
                    }}
                  />
                </View>
              ) : (
                <View style={styles.source}>
                  <Text variant="subhead" color="primary" tabular>
                    {`[${i + 1}]`}
                  </Text>
                  <View style={styles.flex}>
                    <Text variant="subhead" numberOfLines={2}>
                      {s.title}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {`${s.publisher} · ${domainOf(s.url)}${citedIds.includes(s.id) ? ' · cited by a statistic' : ''}`}
                    </Text>
                  </View>
                  <IconButton icon={PencilSimpleIcon} accessibilityLabel={`Edit source ${i + 1}`} size={32} onPress={() => setEditing(s.id)} />
                  <IconButton icon={TrashIcon} accessibilityLabel={`Remove source ${i + 1}`} size={32} onPress={() => onChange(sources.filter((x) => x.id !== s.id))} />
                </View>
              )}
            </View>
          ))}
        </Card>
      )}
      {editing === 'new' ? (
        <Card>
          <SourceForm
            onCancel={() => setEditing(null)}
            onSave={(s) => {
              onChange([...sources, s]);
              setEditing(null);
            }}
          />
        </Card>
      ) : (
        <Button label="Add source" variant="secondary" icon={PlusIcon} onPress={() => setEditing('new')} />
      )}
      <FieldMessage error={error} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  form: { gap: space.md },
  editing: { padding: layout.cardPadding },
  source: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: layout.cardPadding, paddingRight: space.sm, paddingVertical: space.md },
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', gap: space.sm },
});
