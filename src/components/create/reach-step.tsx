import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/divider';
import { EstimatedReach } from '@/components/ui/estimate';
import { IconButton } from '@/components/ui/icon-button';
import { MapPinIcon, MinusIcon, PlusIcon } from '@/components/ui/icons';
import { ListRow } from '@/components/ui/list-row';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { AGE_MAX, AGE_MIN, CHANNELS, formatAgeRange, INTERESTS, rebalanceSplit, searchLocations } from '@/domain/audience';
import { channelLabels } from '@/domain/channels';
import type { Channel } from '@/domain/types';
import { duration, radius, space, useTheme } from '@/theme';

import { AgeRangeSlider } from './age-range-slider';
import { ChipSelect, FieldGroup, StepIntro, type StepProps } from './form';

const YOU = { label: 'You choose', tone: 'primary' as const };
const REVIEW = { label: 'Finalized during review', tone: 'neutral' as const };
const SPLIT_STEP = 5;

function SplitRow({ channel, value, onStep }: { channel: Channel; value: number; onStep: (delta: number) => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)} layout={LinearTransition.duration(duration.base)} style={styles.splitRow}>
      <View style={styles.flex}>
        <Text variant="subhead">{channelLabels[channel]}</Text>
        <View style={[styles.splitTrack, { backgroundColor: colors.surfaceSunken }]}>
          <View style={[styles.splitFill, { width: `${value}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>
      <IconButton icon={MinusIcon} accessibilityLabel={`Less to ${channelLabels[channel]}`} variant="tinted" size={32} disabled={value <= 0} onPress={() => onStep(-SPLIT_STEP)} />
      <Text variant="bodyStrong" tabular style={styles.pct} accessibilityLabel={`${channelLabels[channel]} ${value} percent`}>
        {`${value}%`}
      </Text>
      <IconButton icon={PlusIcon} accessibilityLabel={`More to ${channelLabels[channel]}`} variant="tinted" size={32} disabled={value >= 100} onPress={() => onStep(SPLIT_STEP)} />
    </Animated.View>
  );
}

export function ReachStep({ draft, update, errors }: StepProps) {
  const { colors } = useTheme();
  const { reach } = draft;
  const [query, setQuery] = useState('');
  const results = searchLocations(query, reach.locations);

  const setReach = (patch: Partial<typeof reach>) => update((d) => ({ ...d, reach: { ...d.reach, ...patch } }));

  const toggleChannel = (channel: Channel) => {
    const on = reach.channels.includes(channel);
    const channels = on ? reach.channels.filter((c) => c !== channel) : CHANNELS.filter((c) => c === channel || reach.channels.includes(c));
    // A new channel starts with an even share; the others shrink in proportion.
    const budgetSplit = on
      ? rebalanceSplit(reach.budgetSplit, channels)
      : rebalanceSplit(reach.budgetSplit, channels, { channel, value: Math.round(100 / channels.length / SPLIT_STEP) * SPLIT_STEP });
    setReach({ channels, budgetSplit });
  };

  const stepSplit = (channel: Channel, delta: number) =>
    setReach({ budgetSplit: rebalanceSplit(reach.budgetSplit, reach.channels, { channel, value: (reach.budgetSplit[channel] ?? 0) + delta }) });

  const total = reach.channels.reduce((sum, c) => sum + (reach.budgetSplit[c] ?? 0), 0);

  return (
    <View style={styles.root}>
      <StepIntro title="Reach" body="Who should see your message, where, and for how long. Reviewers may fine-tune targeting before ads run." />

      <FieldGroup label="Locations" required badge={YOU} error={errors['reach.locations']} helper={reach.locations.length ? 'Tap a place to remove it.' : undefined}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search a country, state or city" />
        {results.length > 0 && (
          <Animated.View entering={FadeIn.duration(duration.fast)}>
            <Card padded={false}>
              {results.map((place, i) => (
                <View key={place}>
                  {i > 0 && <Divider />}
                  <ListRow
                    icon={MapPinIcon}
                    title={place}
                    trailing={<PlusIcon size={18} color={colors.primary} />}
                    onPress={() => {
                      setReach({ locations: [...reach.locations, place] });
                      setQuery('');
                    }}
                  />
                </View>
              ))}
            </Card>
          </Animated.View>
        )}
        {query.trim().length > 1 && results.length === 0 && (
          <Text variant="footnote" color="textMuted">
            {`No places match “${query.trim()}”. Search covers the US, its states and large cities.`}
          </Text>
        )}
        {reach.locations.length > 0 && (
          <View style={styles.chips}>
            {reach.locations.map((place) => (
              <Chip key={place} label={place} selected showCheck onPress={() => setReach({ locations: reach.locations.filter((l) => l !== place) })} />
            ))}
          </View>
        )}
      </FieldGroup>

      <FieldGroup label={`Ages ${formatAgeRange(reach.ageRange)}`} badge={YOU}>
        <AgeRangeSlider
          value={reach.ageRange}
          min={AGE_MIN}
          max={AGE_MAX}
          format={(age) => (age >= AGE_MAX ? `${AGE_MAX} plus` : String(age))}
          onChange={(ageRange) => setReach({ ageRange })}
        />
        <View style={styles.ageLabels}>
          <Text variant="caption" color="textMuted">{AGE_MIN}</Text>
          <Text variant="caption" color="textMuted">{`${AGE_MAX}+`}</Text>
        </View>
      </FieldGroup>

      <FieldGroup label="Interests" required badge={YOU} error={errors['reach.interests']} helper="Up to 6. People interested in these are more likely to see the ads.">
        <ChipSelect
          multi
          options={INTERESTS.map((i) => ({ value: i, label: i }))}
          selected={reach.interests}
          onToggle={(interest) =>
            setReach({
              interests: reach.interests.includes(interest)
                ? reach.interests.filter((i) => i !== interest)
                : reach.interests.length < 6
                  ? [...reach.interests, interest]
                  : reach.interests,
            })
          }
        />
      </FieldGroup>

      <FieldGroup label="Channels" required badge={REVIEW} error={errors['reach.channels']}>
        <ChipSelect multi options={CHANNELS.map((c) => ({ value: c, label: channelLabels[c] }))} selected={reach.channels} onToggle={toggleChannel} />
      </FieldGroup>

      {reach.channels.length > 0 && (
        <FieldGroup label="Budget split" badge={REVIEW} error={errors['reach.budgetSplit']} helper={`Always totals 100%. Currently ${total}%.`}>
          <Animated.View layout={LinearTransition.duration(duration.base)} style={styles.split}>
            {reach.channels.map((c) => (
              <SplitRow key={c} channel={c} value={reach.budgetSplit[c] ?? 0} onStep={(delta) => stepSplit(c, delta)} />
            ))}
          </Animated.View>
        </FieldGroup>
      )}

      <FieldGroup label="Ad run" badge={YOU} helper="How long ads run once distribution starts.">
        <SegmentedControl<string>
          accessibilityLabel="Ad run length"
          value={String(reach.durationDays)}
          onChange={(v) => setReach({ durationDays: Number(v) })}
          options={demo.creation.durationOptionsDays.map((d) => ({ value: String(d), label: `${d} days` }))}
        />
      </FieldGroup>

      <Card style={styles.preview}>
        <Text variant="overline" color="textMuted">
          Audience preview
        </Text>
        <Text variant="body">
          {`People aged ${formatAgeRange(reach.ageRange)}${reach.locations.length ? ` in ${reach.locations.join(', ')}` : ' (add a location)'}${
            reach.interests.length ? `, interested in ${reach.interests.join(', ').toLowerCase()}` : ''
          }.`}
        </Text>
        <Text variant="subhead" color="textMuted">
          {reach.channels.length
            ? `${reach.channels.map((c) => `${channelLabels[c]} ${reach.budgetSplit[c] ?? 0}%`).join(' · ')} · ${reach.durationDays}-day run`
            : 'Choose at least one channel.'}
        </Text>
        <Divider />
        <View style={styles.reach}>
          <Text variant="caption" color="textMuted">
            Every $100 raised reaches
          </Text>
          <EstimatedReach amountCents={10_000} variant="bodyStrong" />
        </View>
        <Text variant="footnote" color="textMuted">
          Reach is always a range, never a guarantee. It depends on ad prices, competition and how people respond.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xxl },
  flex: { flex: 1, gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  ageLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -space.xs },
  split: { gap: space.md },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  splitTrack: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  splitFill: { height: '100%', borderRadius: radius.pill },
  pct: { width: 48, textAlign: 'center' },
  preview: { gap: space.md },
  reach: { gap: 2 },
});
