import { Image } from 'expo-image';
import { StyleSheet, TextInput, View } from 'react-native';

import { SourceList } from '@/components/campaign/detail/source-list';
import { StoryRenderer } from '@/components/campaign/detail/story-renderer';
import { SuggestedActions } from '@/components/campaign/detail/suggested-actions';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Divider } from '@/components/ui/divider';
import { EstimatedReach } from '@/components/ui/estimate';
import { ArticleIcon, EyeIcon, ImageSquareIcon, TextAaIcon, UsersIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { demo } from '@/config/demo';
import { formatAgeRange } from '@/domain/audience';
import { categoryLabel, creatorTypeLabels } from '@/domain/categories';
import { channelLabels } from '@/domain/channels';
import { publishableBlocks, SUBMIT_RULES, type DraftStep } from '@/domain/draft';
import { computeFees } from '@/domain/money';
import { formatMoney } from '@/lib/format';
import { fonts, layout, radius, space, useTheme } from '@/theme';

import { AdPreview } from './ad-previews';
import { FieldMessage, StepIntro, type StepProps } from './form';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="subhead" color="textMuted" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="subhead" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function EditLink({ onPress }: { onPress: () => void }) {
  return <Button label="Edit" size="sm" variant="ghost" onPress={onPress} style={styles.edit} />;
}

type Props = StepProps & { onJump: (step: DraftStep) => void; onPreview: () => void };

export function SubmitStep({ draft, update, errors, onJump, onPreview }: Props) {
  const { colors } = useTheme();
  const { basics, story, visuals, reach, submit } = draft;
  const goal = submit.goalCents ?? 0;
  const fees = computeFees(goal);
  const actions = story.blocks.flatMap((b) => (b.type === 'actions' ? b.items.filter((i) => i.trim()) : []));
  const { goalMinCents, goalMaxCents } = demo.creation;

  return (
    <View style={styles.root}>
      <StepIntro title="Submit" body="Check everything, set your funding goal and send it for review." />

      <Card padded={false} style={styles.accordions}>
        <Accordion title="Basics" subtitle={basics.title || 'No title yet'} icon={TextAaIcon}>
          <View style={styles.section}>
            {basics.cover && <Image source={basics.cover.image.source} contentFit="cover" style={[styles.cover, { backgroundColor: colors.surfaceSunken }]} />}
            <Text variant="title3">{basics.title}</Text>
            <Text variant="subhead" color="textMuted">
              {basics.summary}
            </Text>
            <Row label="Category" value={basics.category ? categoryLabel(basics.category) : '—'} />
            <Row label="From" value={`${basics.creatorName}${basics.creatorType ? ` · ${creatorTypeLabels[basics.creatorType]}` : ''}`} />
            <EditLink onPress={() => onJump('basics')} />
          </View>
        </Accordion>
        <Divider />
        <Accordion title="Story" subtitle={`${story.blocks.length} blocks · ${story.sources.length} sources`} icon={ArticleIcon}>
          <View style={styles.section}>
            <View style={styles.bleed}>
              <StoryRenderer blocks={publishableBlocks(story.blocks)} sources={story.sources} />
            </View>
            {actions.length > 0 && <SuggestedActions actions={actions} />}
            <SourceList sources={story.sources} />
            <EditLink onPress={() => onJump('story')} />
          </View>
        </Accordion>
        <Divider />
        <Accordion title="Visuals & ad" subtitle={`${visuals.adImages.length} ad images${visuals.video ? ' · video' : ''}`} icon={ImageSquareIcon}>
          <View style={styles.section}>
            <AdPreview placement="feed" ad={visuals.ad} image={visuals.adImages[0]?.image ?? basics.cover?.image ?? null} creatorName={basics.creatorName} />
            <EditLink onPress={() => onJump('visuals')} />
          </View>
        </Accordion>
        <Divider />
        <Accordion title="Reach" subtitle={reach.locations.slice(0, 2).join(', ') || 'No locations yet'} icon={UsersIcon}>
          <View style={styles.section}>
            <Row label="Where" value={reach.locations.join(', ') || '—'} />
            <Row label="Ages" value={formatAgeRange(reach.ageRange)} />
            <Row label="Interests" value={reach.interests.join(', ') || '—'} />
            <Row label="Channels" value={reach.channels.map((c) => `${channelLabels[c]} ${reach.budgetSplit[c] ?? 0}%`).join(', ') || '—'} />
            <Row label="Ad run" value={`${reach.durationDays} days`} />
            <EditLink onPress={() => onJump('reach')} />
          </View>
        </Accordion>
      </Card>

      <View style={styles.section}>
        <Text variant="title3" accessibilityRole="header">
          Funding goal
          <Text variant="title3" color="danger">{' *'}</Text>
        </Text>
        <View style={[styles.goalField, { borderColor: errors['submit.goalCents'] ? colors.danger : colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.goalCurrency, { color: goal ? colors.text : colors.textDisabled }]}>$</Text>
          <TextInput
            value={goal ? String(Math.round(goal / 100)) : ''}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, '').replace(/^0+/, '');
              update((d) => ({ ...d, submit: { ...d.submit, goalCents: digits ? Number(digits) * 100 : null } }));
            }}
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
            keyboardType="number-pad"
            maxLength={7}
            accessibilityLabel="Funding goal in dollars"
            style={[styles.goalInput, { color: colors.text }]}
          />
        </View>
        <FieldMessage
          error={errors['submit.goalCents']}
          helper={`You set this. From ${formatMoney(goalMinCents)} to ${formatMoney(goalMaxCents)}. It’s how much ad budget backers can pool.`}
        />
      </View>

      <Card style={styles.section}>
        <Text variant="overline" color="textMuted">
          {goal ? `At your ${formatMoney(goal)} goal` : 'Fees and policies'}
        </Text>
        <Row label="Buys ads" value={goal ? formatMoney(fees.adBudgetCents) : `${Math.round((1 - demo.fees.platformPct) * 100)}%`} />
        <Row label="Platform fee" value={goal ? `${formatMoney(fees.platformFeeCents)} (${Math.round(demo.fees.platformPct * 100)}%)` : `${Math.round(demo.fees.platformPct * 100)}%`} />
        <Row label="Card processing" value="Paid by backers at checkout" />
        <Row label="Funding window" value={`${demo.lifecycle.fundingWindowDays} days after approval`} />
        <Row label="Ad run" value={`${reach.durationDays} days`} />
        {goal > 0 && (
          <View style={styles.reach}>
            <Text variant="caption" color="textMuted">
              Estimated reach if fully funded
            </Text>
            <EstimatedReach amountCents={goal} variant="bodyStrong" />
          </View>
        )}
        <Divider />
        <Text variant="footnote" color="textMuted">
          {`If the goal isn’t met, what’s raised still runs a smaller campaign. If less than ${formatMoney(demo.funding.minimumToDistributeCents)} is raised, every backer is refunded. You never receive the money directly.`}
        </Text>
      </Card>

      <View style={styles.section}>
        <Text variant="title3" accessibilityRole="header">
          Before you submit
        </Text>
        {SUBMIT_RULES.map((rule) => (
          <Checkbox
            key={rule.id}
            label={rule.label}
            checked={submit.rules.includes(rule.id)}
            invalid={!!errors['submit.rules'] && !submit.rules.includes(rule.id)}
            onChange={(on) =>
              update((d) => ({
                ...d,
                submit: { ...d.submit, rules: on ? [...d.submit.rules, rule.id] : d.submit.rules.filter((r) => r !== rule.id) },
              }))
            }
          />
        ))}
        <FieldMessage error={errors['submit.rules']} />
      </View>

      <Button label="Preview campaign" variant="secondary" icon={EyeIcon} fullWidth onPress={onPreview} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xxl },
  accordions: { paddingHorizontal: layout.cardPadding },
  section: { gap: space.md },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
  bleed: { marginHorizontal: -layout.gutter },
  row: { flexDirection: 'row', gap: space.md },
  rowLabel: { width: 110 },
  rowValue: { flex: 1, textAlign: 'right' },
  edit: { alignSelf: 'flex-start' },
  goalField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.lg, height: 64 },
  goalCurrency: { fontFamily: fonts.semibold, fontSize: 24, marginRight: 4 },
  goalInput: { flex: 1, fontFamily: fonts.bold, fontSize: 28, padding: 0, fontVariant: ['tabular-nums'] },
  reach: { gap: 2 },
});
