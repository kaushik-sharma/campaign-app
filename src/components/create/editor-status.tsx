import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CloudCheckIcon, CloudSlashIcon, EyeIcon, PaperPlaneTiltIcon, PencilSimpleIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import type { AutosaveStatus } from '@/features/drafts/use-autosave';
import { formatRelative } from '@/lib/format';
import { duration, radius, space, useTheme } from '@/theme';

export type EditorMode = 'editing' | 'previewing' | 'submitting';

const MODES = {
  editing: { label: 'Editing', icon: PencilSimpleIcon },
  previewing: { label: 'Previewing', icon: EyeIcon },
  submitting: { label: 'Submitting', icon: PaperPlaneTiltIcon },
} as const;

/** "Editing / Previewing / Submitting" plus the autosave state, which crossfades as it changes. */
export function EditorStatus({ mode, autosave, savedAt }: { mode: EditorMode; autosave: AutosaveStatus; savedAt: string | null }) {
  const { colors } = useTheme();
  const Mode = MODES[mode];

  const save = {
    saved: { text: savedAt ? `Saved ${formatRelative(savedAt)}` : 'Saved', tone: 'textMuted' as const },
    pending: { text: 'Unsaved changes', tone: 'textMuted' as const },
    saving: { text: 'Saving…', tone: 'textMuted' as const },
    error: { text: 'Not saved · retrying', tone: 'danger' as const },
  }[autosave];

  return (
    <View style={styles.row}>
      <Animated.View key={mode} entering={FadeIn.duration(duration.base)} style={[styles.mode, { backgroundColor: colors.primarySoft }]}>
        <Mode.icon size={12} color={colors.primary} weight="bold" />
        <Text variant="caption" color="primary">
          {Mode.label}
        </Text>
      </Animated.View>
      <Animated.View
        key={autosave}
        entering={FadeIn.duration(duration.base)}
        exiting={FadeOut.duration(duration.fast)}
        style={styles.save}
        accessibilityLiveRegion="polite">
        {autosave === 'saving' ? (
          <ActivityIndicator size="small" />
        ) : autosave === 'error' ? (
          <CloudSlashIcon size={14} color={colors.danger} />
        ) : (
          <CloudCheckIcon size={14} color={colors.textMuted} />
        )}
        <Text variant="caption" color={save.tone}>
          {save.text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  save: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
