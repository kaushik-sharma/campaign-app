import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HowItWorksSheet } from '@/components/campaign/how-it-works';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { InfoIcon, MicrophoneIcon, PencilSimpleIcon, type IconComponent } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { radius, space, useTheme } from '@/theme';

const STEPS = [
  { title: 'Basics', body: 'Title, category, who you are and a short summary.' },
  { title: 'Story', body: 'The full message, with images, statistics and sources.' },
  { title: 'Campaign & Ad Visuals', body: 'Cover, ad images and the copy people see first.' },
  { title: 'Reach', body: 'Where and who the message should reach, and for how long.' },
  { title: 'Submit', body: 'Set your funding goal, preview everything and submit for review.' },
];

function StartOption({ icon: Icon, title, body }: { icon: IconComponent; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.option}>
      <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon size={22} color={colors.primary} />
      </View>
      <View style={styles.optionText}>
        <Text variant="title3">{title}</Text>
        <Text variant="subhead" color="textMuted">
          {body}
        </Text>
      </View>
    </Card>
  );
}

/** Phase 1 create hub: explains the five steps. The guided flow arrives in Phase 4. */
export default function CreateScreen() {
  const { colors } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);
  return (
    <Screen
      title="Create"
      headerRight={
        <IconButton icon={InfoIcon} accessibilityLabel="How Campaigns works" onPress={() => setAboutOpen(true)} />
      }>
      <HowItWorksSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <Section>
        <View style={styles.intro}>
          <Badge label="Creation flow arrives in a later build" tone="info" />
          <Text variant="body" color="textMuted">
            Share a message you want more people to see. Every campaign is reviewed before backers can
            fund its reach.
          </Text>
        </View>
        <View style={styles.options}>
          <StartOption
            icon={PencilSimpleIcon}
            title="Create manually"
            body="A guided, five-step form with a full preview before you submit."
          />
          <StartOption
            icon={MicrophoneIcon}
            title="Create with your voice"
            body="Describe your idea out loud. We draft it; you edit everything."
          />
        </View>
      </Section>
      <Section title="Five steps to a campaign">
        <View>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.dot, { borderColor: colors.primary }]}>
                  <Text variant="caption" color="primary">
                    {i + 1}
                  </Text>
                </View>
                {i < STEPS.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyStrong">{step.title}</Text>
                <Text variant="subhead" color="textMuted">
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.md, marginBottom: space.xl },
  options: { gap: space.md },
  option: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  step: { flexDirection: 'row', gap: space.lg },
  rail: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 1.5, flex: 1, marginVertical: space.xs },
  stepText: { flex: 1, gap: 2, paddingBottom: space.xl, paddingTop: 3 },
});
