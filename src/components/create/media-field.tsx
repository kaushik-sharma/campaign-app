import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import {
  CheckCircleIcon,
  FilmStripIcon,
  ImageSquareIcon,
  MagicWandIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { checkMedia, type MediaAsset, type MediaCheck } from '@/domain/draft';
import { pickMedia } from '@/features/drafts/media';
import { toast } from '@/stores/toast';
import { duration, radius, space, useTheme } from '@/theme';

export function CheckList({ checks }: { checks: MediaCheck[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.checks}>
      {checks.map((c) => {
        const Icon = c.status === 'ok' ? CheckCircleIcon : c.status === 'warn' ? WarningCircleIcon : XCircleIcon;
        const color = c.status === 'ok' ? colors.success : c.status === 'warn' ? colors.warning : colors.danger;
        return (
          <View key={c.id} style={styles.check} accessible accessibilityLabel={`${c.status === 'ok' ? 'Passed' : c.status === 'warn' ? 'Warning' : 'Problem'}: ${c.label}`}>
            <Icon size={14} color={color} weight="fill" />
            <Text variant="caption" color={c.status === 'ok' ? 'textMuted' : c.status === 'warn' ? 'warning' : 'danger'}>
              {c.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

type Props = {
  asset: MediaAsset | null;
  role: 'cover' | 'ad' | 'video';
  onChange: (asset: MediaAsset | null) => void;
  /** Adds a "Generate with AI" option for images. */
  onGenerate?: () => Promise<MediaAsset | null>;
  aspectRatio?: number;
  emptyLabel?: string;
};

/**
 * One image or video slot: pick from the library (or generate a demo image), see the file checks,
 * replace or remove. Assets with blocking problems are refused with the reason.
 */
export function MediaField({ asset, role, onChange, onGenerate, aspectRatio = 16 / 9, emptyLabel }: Props) {
  const { colors } = useTheme();
  const [generating, setGenerating] = useState(false);
  const isVideo = role === 'video';

  const pick = async () => {
    const result = await pickMedia(isVideo ? 'video' : 'image', role);
    if (result.status === 'rejected') {
      const problem = result.checks.find((c) => c.status === 'error');
      toast(`Can’t use this ${isVideo ? 'video' : 'image'}: ${problem?.label ?? 'unsupported file'}`, 'error');
    } else if (result.status === 'picked') {
      onChange(result.asset);
    }
  };

  const generate = async () => {
    if (!onGenerate) return;
    setGenerating(true);
    try {
      const generated = await onGenerate();
      if (generated) onChange(generated);
    } catch {
      toast('Couldn’t generate images. Try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (!asset) {
    return (
      <Animated.View
        layout={LinearTransition.duration(duration.base)}
        style={[styles.empty, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSunken, aspectRatio: isVideo ? undefined : aspectRatio }]}>
        {generating ? (
          <>
            <ActivityIndicator />
            <Text variant="footnote" color="textMuted">
              Generating images…
            </Text>
          </>
        ) : (
          <>
            {isVideo ? <FilmStripIcon size={28} color={colors.textMuted} /> : <ImageSquareIcon size={28} color={colors.textMuted} />}
            <Text variant="footnote" color="textMuted" align="center">
              {emptyLabel ?? (isVideo ? 'MP4 or MOV, 3–60 seconds, up to 100 MB' : 'JPEG, PNG or HEIC, up to 10 MB')}
            </Text>
            <View style={styles.actions}>
              <Button label={isVideo ? 'Choose video' : 'Choose photo'} size="sm" variant="secondary" onPress={() => void pick()} />
              {onGenerate && <Button label="Generate with AI" size="sm" variant="ghost" icon={MagicWandIcon} onPress={() => void generate()} />}
            </View>
          </>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(duration.base)} layout={LinearTransition.duration(duration.base)} style={styles.filled}>
      {asset.kind === 'video' ? (
        <View style={[styles.video, { backgroundColor: colors.surfaceInverse }]}>
          <FilmStripIcon size={28} color={colors.textInverse} />
          <Text variant="footnote" style={{ color: colors.textInverse }}>
            {`Video · ${Math.round((asset.durationMs ?? 0) / 1000)}s`}
          </Text>
        </View>
      ) : (
        <Image
          source={asset.image.source}
          contentFit="cover"
          transition={duration.base}
          accessibilityLabel={asset.image.alt || 'Selected image'}
          style={[styles.image, { aspectRatio, backgroundColor: colors.surfaceSunken }]}
        />
      )}
      <CheckList checks={checkMedia(asset, role)} />
      <View style={styles.actions}>
        <Button label="Replace" size="sm" variant="secondary" onPress={() => void pick()} />
        {onGenerate && !isVideo && (
          <Button label="Generate with AI" size="sm" variant="ghost" icon={MagicWandIcon} loading={generating} onPress={() => void generate()} />
        )}
        <Button label="Remove" size="sm" variant="ghost" onPress={() => onChange(null)} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
    minHeight: 150,
  },
  filled: { gap: space.sm },
  image: { width: '100%', borderRadius: radius.md },
  video: { height: 120, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  checks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: space.xs },
  check: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
