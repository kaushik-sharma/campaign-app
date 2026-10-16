import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EstimatedReach } from '@/components/ui/estimate';
import {
  MegaphoneSimpleIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  type IconComponent,
} from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { duration, radius, space, useTheme } from '@/theme';

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

/**
 * First-run explainer on Home. The dashed outline marks it as temporary; "Don't show again"
 * removes it for good. It stays available from the Create tab's ⓘ button.
 */
export function HowItWorksCard({ onDismiss }: { onDismiss: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(duration.slow)}
      exiting={FadeOut.duration(duration.fast)}
      style={[styles.card, { borderColor: colors.borderStrong }]}>
      <Text variant="title3" accessibilityRole="header">
        How Campaigns works
      </Text>
      <HowItWorksTimeline />
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <PressableScale
          onPress={onDismiss}
          haptic="selection"
          scaleTo={0.96}
          hitSlop={12}
          accessibilityLabel="Don’t show again"
          accessibilityHint="Hides this explainer. It stays available from the Create tab.">
          <Text variant="footnote" color="textMuted" style={styles.dismiss}>
            Don’t show again
          </Text>
        </PressableScale>
      </View>
    </Animated.View>
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
  card: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.xl,
  },
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.md,
    marginTop: -space.xs,
  },
  dismiss: { textDecorationLine: 'underline' },
});
