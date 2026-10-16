import { StyleSheet, View } from 'react-native';

import { EstimatedReach } from '@/components/ui/estimate';
import {
  MegaphoneSimpleIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  type IconComponent,
} from '@/components/ui/icons';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { space, useTheme } from '@/theme';

type Step = { icon: IconComponent; title: string; body: string };

const STEPS: Step[] = [
  { icon: PencilSimpleIcon, title: 'Create', body: 'You write the message and cite sources.' },
  { icon: ShieldCheckIcon, title: 'Review', body: 'We check the story, sources and ads before anything runs.' },
  {
    icon: MegaphoneSimpleIcon,
    title: 'Amplify',
    body: 'Backers fund ads that show it to people outside the creator’s network.',
  },
];

const NODE = 32;

/**
 * The Create → Review → Amplify sequence as a vertical timeline. Contributions are framed as
 * paying for reach, never as donations.
 */
export function HowItWorksTimeline() {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="list">
      {STEPS.map(({ icon: Icon, title, body }, i) => {
        const last = i === STEPS.length - 1;
        return (
          <View key={title} style={styles.step} accessible accessibilityLabel={`Step ${i + 1}, ${title}. ${body}`}>
            <View style={styles.rail}>
              <View style={[styles.node, { backgroundColor: colors.primarySoft }]}>
                <Icon size={16} color={colors.primary} weight="bold" />
              </View>
              {!last && <View style={[styles.line, { backgroundColor: colors.borderStrong }]} />}
            </View>
            <View style={[styles.content, !last && styles.contentSpaced]}>
              <Text variant="caption" color="textMuted">
                Step {i + 1}
              </Text>
              <Text variant="bodyStrong">{title}</Text>
              <Text variant="subhead" color="textMuted">
                {body}
              </Text>
              {last && (
                <View style={styles.reach}>
                  <Text variant="footnote" color="textMuted">
                    Each $1 contributed reaches about
                  </Text>
                  <EstimatedReach amountCents={100} variant="subhead" />
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** The same explainer on demand, from the Create tab's ⓘ button. */
export function HowItWorksSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="How Campaigns works">
      <HowItWorksTimeline />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: space.md },
  rail: { alignItems: 'center', width: NODE },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, borderRadius: 1, marginVertical: space.xs },
  content: { flex: 1, gap: 2, paddingTop: 1 },
  contentSpaced: { paddingBottom: space.xl },
  reach: { gap: 2, marginTop: space.sm },
});
