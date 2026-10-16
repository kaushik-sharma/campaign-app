import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { IconButton } from '@/components/ui/icon-button';
import { MagicWandIcon, PlusIcon, WarningCircleIcon, XIcon } from '@/components/ui/icons';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { demo } from '@/config/demo';
import { checkMedia, CTA_OPTIONS, QUALITY_CHECKS, visualsWarnings, type MediaAsset } from '@/domain/draft';
import { useGenerateImages } from '@/features/ai/queries';
import { pickMedia } from '@/features/drafts/media';
import { toast } from '@/stores/toast';
import { duration, radius, space, useTheme } from '@/theme';

import { AdPreview, type Placement } from './ad-previews';
import { ChipSelect, FieldGroup, StepIntro, type StepProps } from './form';
import { CheckList, MediaField } from './media-field';

function AdImageRow({ asset, index, onRemove }: { asset: MediaAsset; index: number; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(duration.base)} exiting={FadeOut.duration(duration.fast)} layout={LinearTransition.duration(duration.base)} style={styles.adRow}>
      <Image source={asset.image.source} contentFit="cover" style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]} accessibilityLabel={`Ad image ${index + 1}`} />
      <View style={styles.flex}>
        <Text variant="subhead">{`Ad image ${index + 1}`}</Text>
        <CheckList checks={checkMedia(asset, 'ad')} />
      </View>
      <IconButton icon={XIcon} accessibilityLabel={`Remove ad image ${index + 1}`} size={32} onPress={onRemove} />
    </Animated.View>
  );
}

export function VisualsStep({ draft, update, errors }: StepProps) {
  const { colors } = useTheme();
  const { visuals, basics } = draft;
  const generate = useGenerateImages();
  const [placement, setPlacement] = useState<Placement>('feed');
  const warnings = visualsWarnings(draft);
  const room = demo.creation.maxAdImages - visuals.adImages.length;

  const setVisuals = (patch: Partial<typeof visuals>) => update((d) => ({ ...d, visuals: { ...d.visuals, ...patch } }));
  const setAd = (patch: Partial<typeof visuals.ad>) => update((d) => ({ ...d, visuals: { ...d.visuals, ad: { ...d.visuals.ad, ...patch } } }));
  const addAdImages = (assets: MediaAsset[]) =>
    update((d) => ({ ...d, visuals: { ...d.visuals, adImages: [...d.visuals.adImages, ...assets].slice(0, demo.creation.maxAdImages) } }));

  const pickAd = async () => {
    const result = await pickMedia('image', 'ad');
    if (result.status === 'rejected') toast(`Can’t use this image: ${result.checks.find((c) => c.status === 'error')?.label}`, 'error');
    if (result.status === 'picked') addAdImages([result.asset]);
  };

  const previewImage = visuals.adImages[0]?.image ?? basics.cover?.image ?? null;

  return (
    <View style={styles.root}>
      <StepIntro title="Campaign & Ad Visuals" body="The images and words people see in their feeds before they ever open your campaign." />

      <FieldGroup label="Cover image" required error={errors['basics.cover']} helper="Set in Basics. You can change it here too.">
        <MediaField
          asset={basics.cover}
          role="cover"
          onChange={(cover) => update((d) => ({ ...d, basics: { ...d.basics, cover } }))}
          onGenerate={async () => (await generate.mutateAsync({ category: basics.category, count: 1 }))[0] ?? null}
        />
      </FieldGroup>

      <FieldGroup label="Ad images" helper={`Up to ${demo.creation.maxAdImages}. Square (1:1) or 4:5 works in the most placements.`}>
        <Animated.View layout={LinearTransition.duration(duration.base)} style={styles.adList}>
          {visuals.adImages.map((asset, i) => (
            <AdImageRow
              key={`${i}-${typeof asset.image.source === 'number' ? asset.image.source : asset.image.source.uri}`}
              asset={asset}
              index={i}
              onRemove={() => setVisuals({ adImages: visuals.adImages.filter((_, j) => j !== i) })}
            />
          ))}
          {room > 0 && (
            <View style={styles.row}>
              <Button label="Add image" size="sm" variant="secondary" icon={PlusIcon} onPress={() => void pickAd()} />
              <Button
                label="Generate with AI"
                size="sm"
                variant="ghost"
                icon={MagicWandIcon}
                loading={generate.isPending}
                onPress={() =>
                  generate.mutate(
                    { category: basics.category, count: Math.min(2, room) },
                    { onSuccess: addAdImages, onError: () => toast('Couldn’t generate images. Try again.', 'error') },
                  )
                }
              />
            </View>
          )}
        </Animated.View>
      </FieldGroup>

      <FieldGroup label="Video" helper="Optional. Vertical or square, 3–60 seconds.">
        <MediaField asset={visuals.video} role="video" onChange={(video) => setVisuals({ video })} />
      </FieldGroup>

      {warnings.length > 0 && (
        <View style={styles.warnings}>
          {warnings.map((w) => (
            <View key={w} style={[styles.warning, { backgroundColor: colors.warningSoft }]}>
              <WarningCircleIcon size={16} color={colors.warning} />
              <Text variant="footnote" color="warning" style={styles.flex}>
                {w}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text variant="title3" accessibilityRole="header">
          Ad copy
        </Text>
        <TextField
          label="Ad headline"
          required
          value={visuals.ad.headline}
          onChangeText={(headline) => setAd({ headline })}
          maxLength={40}
          error={errors['visuals.ad.headline']}
          helper={basics.title && !visuals.ad.headline ? undefined : 'Short and specific. Shown in bold.'}
        />
        {basics.title.trim() && !visuals.ad.headline && (
          <Button label="Use my title" size="sm" variant="ghost" onPress={() => setAd({ headline: basics.title.trim().slice(0, 40) })} />
        )}
        <TextField
          label="Description"
          required
          multiline
          value={visuals.ad.description}
          onChangeText={(description) => setAd({ description })}
          maxLength={90}
          error={errors['visuals.ad.description']}
        />
        <FieldGroup label="Call to action" required error={errors['visuals.ad.callToAction']}>
          <ChipSelect
            options={CTA_OPTIONS.map((c) => ({ value: c, label: c }))}
            selected={[visuals.ad.callToAction]}
            onToggle={(callToAction) => setAd({ callToAction })}
          />
        </FieldGroup>
      </View>

      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Text variant="title3" accessibilityRole="header" style={styles.flex}>
            Preview
          </Text>
          <Badge label="Generic mock-ups" />
        </View>
        <SegmentedControl<Placement>
          accessibilityLabel="Ad placement"
          value={placement}
          onChange={setPlacement}
          options={[
            { value: 'feed', label: 'Feed' },
            { value: 'story', label: 'Story' },
            { value: 'article', label: 'Article' },
            { value: 'search', label: 'Search' },
          ]}
        />
        <Animated.View key={placement} entering={FadeIn.duration(duration.base)}>
          <AdPreview placement={placement} ad={visuals.ad} image={previewImage} creatorName={basics.creatorName} />
        </Animated.View>
      </View>

      <Card tone="sunken" elevation="e0" style={styles.checklist}>
        <Text variant="subhead">Creative quality checklist</Text>
        <Text variant="footnote" color="textMuted">
          Optional. Ads that pass these tend to be approved faster.
        </Text>
        {QUALITY_CHECKS.map((q) => (
          <Checkbox
            key={q.id}
            label={q.label}
            checked={visuals.checklist.includes(q.id)}
            onChange={(on) =>
              setVisuals({ checklist: on ? [...visuals.checklist, q.id] : visuals.checklist.filter((x) => x !== q.id) })
            }
          />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xxl },
  flex: { flex: 1, gap: space.xs },
  section: { gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  adList: { gap: space.md },
  adRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  warnings: { gap: space.sm },
  warning: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
  checklist: { gap: space.xs },
});
