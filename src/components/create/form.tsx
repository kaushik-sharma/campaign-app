import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import type { Draft, FieldErrors } from '@/domain/draft';
import { haptics } from '@/lib/haptics';
import { duration, space } from '@/theme';

/** What every step receives from the editor. */
export type StepProps = {
  draft: Draft;
  update: (recipe: (d: Draft) => Draft) => void;
  /** Only populated after the creator tried to continue, then kept live as they fix things. */
  errors: FieldErrors;
};

export function StepIntro({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.intro}>
      <Text variant="title1" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color="textMuted">
        {body}
      </Text>
    </View>
  );
}

/** Shakes once and fires a warning haptic whenever a new message appears. */
export function FieldMessage({ error, helper }: { error?: string; helper?: string }) {
  const shake = useSharedValue(0);
  useEffect(() => {
    if (!error) return;
    haptics.warning();
    shake.set(
      withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  }, [error, shake]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  if (error) {
    return (
      <Animated.View key="error" entering={FadeInDown.duration(duration.fast)} exiting={FadeOut.duration(duration.instant)} style={style}>
        <Text variant="footnote" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      </Animated.View>
    );
  }
  return helper ? (
    <Text variant="footnote" color="textMuted">
      {helper}
    </Text>
  ) : null;
}

/** A labelled group for non-text inputs (chips, images, sliders), with the same error treatment as TextField. */
export function FieldGroup({
  label,
  required,
  error,
  helper,
  badge,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  /** e.g. "You choose" / "Finalized during review". */
  badge?: { label: string; tone: 'primary' | 'neutral' };
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text variant="subhead" style={styles.flex}>
          {label}
          {required && <Text variant="subhead" color="danger">{' *'}</Text>}
        </Text>
        {badge && <Badge label={badge.label} tone={badge.tone} />}
      </View>
      {children}
      <FieldMessage error={error} helper={helper} />
    </View>
  );
}

export function ChipSelect<T extends string>({
  options,
  selected,
  onToggle,
  multi = false,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  multi?: boolean;
}) {
  return (
    <View style={styles.chips} accessibilityRole={multi ? undefined : 'radiogroup'}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={selected.includes(o.value)} showCheck={multi} onPress={() => onToggle(o.value)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.xs },
  group: { gap: space.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
