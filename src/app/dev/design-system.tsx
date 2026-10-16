import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampaignRowSkeleton } from '@/components/campaign/campaign-row';
import { Accordion } from '@/components/ui/accordion';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EstimatedReach } from '@/components/ui/estimate';
import { IconButton } from '@/components/ui/icon-button';
import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  ChartBarIcon,
  MegaphoneSimpleIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status-pill';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { CAMPAIGN_STATUSES } from '@/domain/lifecycle';
import { ServiceError } from '@/services';
import { toast } from '@/stores/toast';
import { radius, space, typography, useTheme, type ColorTokens, type TypeVariant } from '@/theme';

const SWATCHES: (keyof ColorTokens)[] = [
  'bg',
  'surface',
  'surfaceSunken',
  'border',
  'text',
  'textMuted',
  'primary',
  'primarySoft',
  'success',
  'warning',
  'danger',
];

/** Living reference of tokens and components in the active theme. */
export default function DesignSystemScreen() {
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0.72);
  const [raised, setRaised] = useState(864_000);
  const [chips, setChips] = useState<string[]>(['Health']);
  const [segment, setSegment] = useState<'story' | 'funding' | 'reach'>('story');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Screen title="Design system" eyebrow="Campaigns" back>
      <Section title="Color">
        <View style={styles.swatches}>
          {SWATCHES.map((key) => (
            <View key={key} style={styles.swatch}>
              <View style={[styles.swatchColor, { backgroundColor: colors[key], borderColor: colors.border }]} />
              <Text variant="caption" color="textMuted" numberOfLines={1}>
                {key}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type">
        <Card style={styles.stack}>
          {(Object.keys(typography) as TypeVariant[]).map((v) => (
            <Text key={v} variant={v} numberOfLines={1}>
              {v === 'amount' ? '$8,640' : v.startsWith('story') ? 'A message worth hearing' : v}
            </Text>
          ))}
        </Card>
      </Section>

      <Section title="Buttons">
        <View style={styles.stack}>
          <Button label="Back this campaign" fullWidth size="lg" />
          <Button label="Start a campaign" variant="secondary" fullWidth icon={ArrowRightIcon} iconPosition="trailing" />
          <View style={styles.row}>
            <Button
              label="Submit"
              loading={loading}
              onPress={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1500);
              }}
            />
            <Button label="Ghost" variant="ghost" />
            <Button label="Delete" variant="destructive" size="sm" />
            <Button label="Disabled" disabled size="sm" />
          </View>
          <View style={styles.row}>
            <IconButton icon={ShareNetworkIcon} accessibilityLabel="Share" variant="tinted" />
            <IconButton icon={BookmarkSimpleIcon} accessibilityLabel="Save" variant="surface" />
            <IconButton icon={SparkleIcon} accessibilityLabel="AI suggestion" />
          </View>
        </View>
      </Section>

      <Section title="Chips, badges & status">
        <View style={styles.stack}>
          <View style={styles.wrap}>
            {['Health', 'Environment', 'Education', 'Community'].map((c) => (
              <Chip
                key={c}
                label={c}
                showCheck
                selected={chips.includes(c)}
                onPress={() => setChips((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
              />
            ))}
          </View>
          <View style={styles.wrap}>
            <Badge label="Neutral" />
            <Badge label="Info" tone="info" />
            <Badge label="Verified source" tone="success" icon={ShieldCheckIcon} />
            <Badge label="Needs edits" tone="warning" />
            <Badge label="Failed" tone="danger" />
          </View>
          <View style={styles.wrap}>
            {CAMPAIGN_STATUSES.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </View>
        </View>
      </Section>

      <Section title="Progress & numbers">
        <Card style={styles.stack}>
          <View style={styles.between}>
            <AnimatedNumber value={raised} format="money" variant="amount" />
            <AnimatedNumber value={progress} format="percent" variant="title3" color="textMuted" />
          </View>
          <ProgressBar value={progress} accessibilityLabel="Funding progress" />
          <EstimatedReach amountCents={1_200_000} suffix="people at goal" />
          <View style={styles.row}>
            <Button
              label="Add backing"
              size="sm"
              variant="secondary"
              onPress={() => {
                const next = Math.min(1_200_000, raised + 125_000);
                setRaised(next);
                setProgress(next / 1_200_000);
              }}
            />
            <Button
              label="Reset"
              size="sm"
              variant="ghost"
              onPress={() => {
                setRaised(864_000);
                setProgress(0.72);
              }}
            />
          </View>
        </Card>
      </Section>

      <Section title="Controls">
        <View style={styles.stack}>
          <SegmentedControl
            accessibilityLabel="Section"
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'story', label: 'Story' },
              { value: 'funding', label: 'Funding' },
              { value: 'reach', label: 'Reach' },
            ]}
          />
          <TextField
            label="Campaign title"
            required
            maxLength={60}
            placeholder="What should people know?"
            helper="The start of your title may be used as the ad headline."
            value={title}
            onChangeText={setTitle}
            error={showError ? 'Add a title so people know what this is about' : undefined}
          />
          <View style={styles.row}>
            <Button label={showError ? 'Clear error' : 'Show error'} size="sm" variant="secondary" onPress={() => setShowError((v) => !v)} />
            <Button label="Open sheet" size="sm" variant="secondary" onPress={() => setSheetOpen(true)} />
            <Button label="Toast" size="sm" variant="secondary" onPress={() => toast('Draft saved', 'success')} />
          </View>
        </View>
      </Section>

      <Section title="Expandable">
        <Card padded={false} style={styles.accordions}>
          <Accordion title="Use of funds" subtitle="Where each dollar goes" icon={ChartBarIcon}>
            <Text variant="subhead" color="textMuted">
              90% of funds raised pays for advertising. 10% covers review, ad setup and reporting.
              Contributions fund distribution of the message, not the cause itself.
            </Text>
          </Accordion>
          <Accordion title="Audience & distribution" icon={MegaphoneSimpleIcon}>
            <Text variant="subhead" color="textMuted">
              Ads run in social feeds, stories and news sites in the selected regions.
            </Text>
          </Accordion>
        </Card>
      </Section>

      <Section title="Identity">
        <View style={styles.row}>
          <Avatar name="Alex Rivera" size={56} />
          <Avatar name="Friends of Mill Creek" />
          <Avatar name="Sam Okafor" size={32} />
        </View>
      </Section>

      <Section title="Loading">
        <SkeletonGroup style={styles.stack}>
          <CampaignRowSkeleton />
        </SkeletonGroup>
      </Section>

      <Section title="Empty & error">
        <Card padded={false}>
          <EmptyState
            compact
            icon={BookmarkSimpleIcon}
            title="No saved campaigns"
            message="Save a campaign to read it later."
            action={{ label: 'Explore campaigns', onPress: () => {} }}
          />
        </Card>
        <Card padded={false} style={{ marginTop: space.md }}>
          <ErrorState compact error={new ServiceError('network', 'offline')} onRetry={() => {}} />
        </Card>
      </Section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Back this campaign"
        subtitle="Contributions pay for ads, not the cause"
        footer={<Button label="Continue" size="lg" fullWidth onPress={() => setSheetOpen(false)} />}>
        <View style={[styles.sheetBox, { backgroundColor: colors.surfaceSunken }]}>
          <Text variant="body" color="textMuted">
            Bottom sheets size to their content, spring into place and close with a swipe, the backdrop or
            the close button.
          </Text>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  swatch: { width: 72, gap: space.xs },
  swatchColor: { height: 48, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth },
  stack: { gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  accordions: { paddingHorizontal: space.lg },
  sheetBox: { padding: space.lg, borderRadius: radius.md },
});
