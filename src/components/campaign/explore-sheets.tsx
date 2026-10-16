import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/divider';
import { CheckIcon } from '@/components/ui/icons';
import { ListRow } from '@/components/ui/list-row';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { creatorTypeLabels } from '@/domain/categories';
import { statusMeta, type CampaignStatus } from '@/domain/lifecycle';
import type { CampaignFilters, CampaignSort, CreatorType, ProgressBand } from '@/domain/types';
import { space, useTheme } from '@/theme';

export const SORT_OPTIONS: { value: CampaignSort; label: string; hint: string }[] = [
  { value: 'trending', label: 'Trending', hint: 'Most attention right now' },
  { value: 'newest', label: 'Newest', hint: 'Recently opened for backing' },
  { value: 'ending-soon', label: 'Ending soon', hint: 'Funding closes first' },
  { value: 'closest-to-goal', label: 'Closest to goal', hint: 'Nearly funded' },
  { value: 'most-funded', label: 'Most funded', hint: 'Highest amount raised' },
];

const STATUS_OPTIONS: CampaignStatus[] = ['funding', 'goal-reached', 'distribution-prep', 'promoting', 'completed', 'funding-ended'];
const CREATOR_OPTIONS = Object.keys(creatorTypeLabels) as CreatorType[];

export function activeFilterCount(f: CampaignFilters): number {
  return (
    (f.statuses?.length ?? 0) +
    (f.creatorTypes?.length ?? 0) +
    (f.progress && f.progress !== 'any' ? 1 : 0) +
    (f.endingSoon ? 1 : 0)
  );
}

export function SortSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: CampaignSort;
  onChange: (sort: CampaignSort) => void;
}) {
  const { colors } = useTheme();
  return (
    <Sheet open={open} onClose={onClose} title="Sort by">
      <View>
        {SORT_OPTIONS.map((o, i) => (
          <View key={o.value}>
            {i > 0 && <Divider />}
            <ListRow
              title={o.label}
              subtitle={o.hint}
              trailing={value === o.value ? <CheckIcon size={20} color={colors.primary} weight="bold" /> : <View />}
              onPress={() => {
                onChange(o.value);
                onClose();
              }}
            />
          </View>
        ))}
      </View>
    </Sheet>
  );
}

function toggle<T>(list: T[] | undefined, item: T): T[] {
  const current = list ?? [];
  return current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
}

/** Filters are edited as a draft and only applied on "Show results", so results don't jump while choosing. */
export function FilterSheet({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: CampaignFilters;
  onApply: (filters: CampaignFilters) => void;
}) {
  const [draft, setDraft] = useState<CampaignFilters>(value);
  const [lastOpen, setLastOpen] = useState(open);
  // Reset the draft to the applied filters each time the sheet opens (adjusted during render).
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setDraft(value);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      scrollable
      footer={
        <View style={styles.footer}>
          <Button label="Reset" variant="ghost" onPress={() => setDraft({})} />
          <Button
            label="Show results"
            style={styles.apply}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      }>
      <View style={styles.body}>
        <View style={styles.group}>
          <Text variant="subhead">Status</Text>
          <View style={styles.wrap}>
            {STATUS_OPTIONS.map((s) => (
              <Chip
                key={s}
                label={statusMeta[s].label}
                showCheck
                selected={draft.statuses?.includes(s) ?? false}
                onPress={() => setDraft((d) => ({ ...d, statuses: toggle(d.statuses, s) }))}
              />
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <Text variant="subhead">Created by</Text>
          <View style={styles.wrap}>
            {CREATOR_OPTIONS.map((c) => (
              <Chip
                key={c}
                label={creatorTypeLabels[c]}
                showCheck
                selected={draft.creatorTypes?.includes(c) ?? false}
                onPress={() => setDraft((d) => ({ ...d, creatorTypes: toggle(d.creatorTypes, c) }))}
              />
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <Text variant="subhead">Funding progress</Text>
          <SegmentedControl<ProgressBand>
            accessibilityLabel="Funding progress"
            value={draft.progress ?? 'any'}
            onChange={(progress) => setDraft((d) => ({ ...d, progress }))}
            options={[
              { value: 'any', label: 'Any' },
              { value: 'early', label: '<50%' },
              { value: 'halfway', label: '50–90%' },
              { value: 'almost', label: '90%+' },
            ]}
          />
        </View>
        <ListRow
          title="Ending within 7 days"
          subtitle="Funding campaigns about to close"
          trailing={
            <Switch
              value={draft.endingSoon ?? false}
              onValueChange={(endingSoon) => setDraft((d) => ({ ...d, endingSoon }))}
              accessibilityLabel="Ending within 7 days"
            />
          }
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.xl },
  group: { gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { flexDirection: 'row', gap: space.sm },
  apply: { flex: 1, alignSelf: 'auto' },
});
