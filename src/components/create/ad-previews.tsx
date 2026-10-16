import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { MagnifyingGlassIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import type { AdCreative, ImageAsset } from '@/domain/types';
import { radius, space, useTheme } from '@/theme';

export type Placement = 'feed' | 'story' | 'article' | 'search';

type Props = {
  placement: Placement;
  ad: AdCreative;
  image: ImageAsset | null;
  creatorName: string;
};

const fallback = (s: string, f: string) => (s.trim() ? s : f);

/** A generic grey line standing in for surrounding page text. */
function Line({ width = '100%' }: { width?: `${number}%` }) {
  const { colors } = useTheme();
  return <View style={[styles.line, { width, backgroundColor: colors.border }]} />;
}

function Img({ image, style }: { image: ImageAsset | null; style: object }) {
  const { colors } = useTheme();
  return image ? (
    <Image source={image.source} contentFit="cover" style={[style, { backgroundColor: colors.surfaceSunken }]} />
  ) : (
    <View style={[style, { backgroundColor: colors.surfaceSunken }]} />
  );
}

/**
 * How the ad could look in four generic placements. These are neutral mock-ups, not imitations
 * of any real platform, and are labelled as such.
 */
export function AdPreview({ placement, ad, image, creatorName }: Props) {
  const { colors } = useTheme();
  const headline = fallback(ad.headline, 'Your ad headline');
  const description = fallback(ad.description, 'Your ad description appears here.');
  const name = fallback(creatorName, 'Your name');
  const cta = (
    <View style={[styles.cta, { backgroundColor: colors.primary }]}>
      <Text variant="caption" color="onPrimary">
        {ad.callToAction}
      </Text>
    </View>
  );

  if (placement === 'feed') {
    return (
      <View style={[styles.frame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.feedHeader}>
          <Avatar name={name} size={28} />
          <View style={styles.flex}>
            <Text variant="caption" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" color="textMuted">
              Sponsored
            </Text>
          </View>
        </View>
        <Img image={image} style={styles.square} />
        <View style={styles.feedBody}>
          <View style={styles.flex}>
            <Text variant="subhead" numberOfLines={2}>
              {headline}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {description}
            </Text>
          </View>
          {cta}
        </View>
      </View>
    );
  }

  if (placement === 'story') {
    return (
      <View style={styles.storyWrap}>
        <View style={styles.story}>
          <Img image={image} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
          <View style={styles.storyTop}>
            <View style={[styles.storyBar, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />
            <Text variant="caption" style={styles.onImage}>
              {`${name} · Sponsored`}
            </Text>
          </View>
          <View style={styles.storyBottom}>
            <Text variant="title3" style={styles.onImage} numberOfLines={3}>
              {headline}
            </Text>
            <View style={[styles.storyCta, { backgroundColor: '#FFFFFF' }]}>
              <Text variant="caption" style={{ color: '#121417' }}>
                {ad.callToAction}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (placement === 'article') {
    return (
      <View style={[styles.frame, styles.article, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Line width="70%" />
        <Line />
        <Line width="90%" />
        <View style={[styles.banner, { borderColor: colors.border }]}>
          <Text variant="caption" color="textMuted" style={styles.adLabel}>
            Advertisement
          </Text>
          <View style={styles.bannerRow}>
            <Img image={image} style={styles.bannerImage} />
            <View style={styles.flex}>
              <Text variant="subhead" numberOfLines={2}>
                {headline}
              </Text>
              <Text variant="caption" color="textMuted" numberOfLines={2}>
                {description}
              </Text>
            </View>
          </View>
        </View>
        <Line />
        <Line width="80%" />
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSunken }]}>
        <MagnifyingGlassIcon size={14} color={colors.textMuted} />
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {headline.toLowerCase()}
        </Text>
      </View>
      <View style={styles.result}>
        <Text variant="caption" color="textMuted">
          {'Sponsored · campaigns.app › story'}
        </Text>
        <Text variant="bodyStrong" color="primary" numberOfLines={2}>
          {headline}
        </Text>
        <Text variant="footnote" color="textMuted" numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Line width="60%" />
      <Line width="85%" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  frame: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm },
  square: { width: '100%', aspectRatio: 1 },
  feedBody: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  cta: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.sm },
  storyWrap: { alignItems: 'center' },
  story: { width: '62%', aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'space-between', padding: space.md },
  storyTop: { gap: space.sm },
  storyBar: { height: 2, borderRadius: 1 },
  storyBottom: { gap: space.md, alignItems: 'flex-start' },
  storyCta: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: space.sm, borderRadius: radius.pill },
  onImage: { color: '#FFFFFF' },
  article: { padding: space.lg, gap: space.sm },
  line: { height: 8, borderRadius: 4 },
  banner: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: space.sm, gap: space.xs, marginVertical: space.sm },
  adLabel: { fontSize: 10 },
  bannerRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  bannerImage: { width: 96, aspectRatio: 1.91, borderRadius: radius.xs },
  search: { padding: space.lg, gap: space.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, height: 34, borderRadius: radius.pill },
  result: { gap: 2 },
});
