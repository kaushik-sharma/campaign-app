import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BackPreviewSheet } from '@/components/campaign/detail/back-preview-sheet';
import { AudienceDistribution, ReviewTrust, UseOfFunds } from '@/components/campaign/detail/explainers';
import { FeedbackPoll } from '@/components/campaign/detail/feedback-poll';
import { FundingPanel } from '@/components/campaign/detail/funding-panel';
import { HeroCover } from '@/components/campaign/detail/hero-cover';
import { SourceList } from '@/components/campaign/detail/source-list';
import { StickyBackBar } from '@/components/campaign/detail/sticky-back-bar';
import { StoryRenderer } from '@/components/campaign/detail/story-renderer';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { IconButton } from '@/components/ui/icon-button';
import { ArrowLeftIcon, CheckIcon, ShareNetworkIcon } from '@/components/ui/icons';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status-pill';
import { Text } from '@/components/ui/text';
import { categoryLabel, creatorTypeLabels } from '@/domain/categories';
import { acceptsContributions } from '@/domain/lifecycle';
import type { Campaign } from '@/domain/types';
import { useCampaign } from '@/features/campaigns/queries';
import { formatDate, formatRelative } from '@/lib/format';
import { shareCampaign } from '@/lib/share';
import { useHeroStore } from '@/stores/hero';
import { duration, easing, fonts, layout, radius, space, useTheme } from '@/theme';

const HEADER = 52;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title2" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function CampaignBody({
  campaign,
  onBack,
  onFundingLayout,
}: {
  campaign: Campaign;
  onBack: () => void;
  onFundingLayout: (bottom: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.titleBlock}>
        <View style={styles.metaRow}>
          <Text variant="overline" color="textMuted" style={styles.flex} numberOfLines={1}>
            {categoryLabel(campaign.category)}
            {campaign.publishedAt ? ` · ${formatDate(campaign.publishedAt)}` : ''}
          </Text>
          <StatusPill status={campaign.status} />
        </View>
        <Text variant="storyTitle" accessibilityRole="header">
          {campaign.title}
        </Text>
        <View style={styles.creator}>
          <Avatar name={campaign.creator.name} size={40} />
          <View style={styles.flex}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {campaign.creator.name}
            </Text>
            <Text variant="footnote" color="textMuted" numberOfLines={1}>
              {creatorTypeLabels[campaign.creator.type]} · {campaign.creator.location}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.gutter}
        onLayout={(e) => onFundingLayout(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        <FundingPanel campaign={campaign} onBack={onBack} onShare={() => void shareCampaign(campaign)} />
      </View>

      <View style={styles.storyBlock}>
        <Text variant="storyBody" color="textMuted" style={styles.lede}>
          {campaign.summary}
        </Text>
        <StoryRenderer blocks={campaign.story} sources={campaign.sources} />
      </View>

      {campaign.suggestedActions.length > 0 && (
        <Section title="What you can do">
          <Card padded={false}>
            {campaign.suggestedActions.map((action, i) => (
              <View key={action}>
                {i > 0 && <Divider inset={layout.cardPadding} />}
                <View style={styles.action}>
                  <View style={[styles.actionIcon, { backgroundColor: colors.successSoft }]}>
                    <CheckIcon size={14} color={colors.success} weight="bold" />
                  </View>
                  <Text variant="body" style={styles.flex}>
                    {action}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Sources">
        <SourceList sources={campaign.sources} />
      </Section>

      {campaign.updates.length > 0 && (
        <Section title="Updates">
          {campaign.updates.map((u) => (
            <Card key={u.id} tone="sunken" style={styles.update}>
              <Text variant="caption" color="textMuted">
                {formatRelative(u.at)}
              </Text>
              <Text variant="bodyStrong">{u.title}</Text>
              <Text variant="subhead" color="textMuted">
                {u.body}
              </Text>
            </Card>
          ))}
        </Section>
      )}

      <View style={[styles.gutter, styles.accordions]}>
        <Card padded={false} style={styles.accordionCard}>
          <UseOfFunds campaign={campaign} />
          <Divider />
          <AudienceDistribution campaign={campaign} />
          <Divider />
          <ReviewTrust campaign={campaign} />
        </Card>
      </View>

      <View style={styles.gutter}>
        <FeedbackPoll campaignId={campaign.id} />
      </View>

      <Text variant="caption" color="textMuted" align="center" style={styles.footnote}>
        Campaigns, figures and creators in this prototype are demo data.
      </Text>
    </>
  );
}

function BodySkeleton() {
  return (
    <SkeletonGroup style={styles.skeleton} label="Loading campaign">
      <Skeleton width="40%" height={12} />
      <Skeleton height={28} />
      <Skeleton width="75%" height={28} />
      <Skeleton height={180} radius={radius.lg} style={{ marginTop: space.lg }} />
      <Skeleton height={16} style={{ marginTop: space.lg }} />
      <Skeleton height={16} />
      <Skeleton width="60%" height={16} />
    </SkeletonGroup>
  );
}

/**
 * Campaign detail: an editorial page with funding and reach always one tap away.
 * Story first, money second; sources always visible; secondary detail in accordions.
 */
export default function CampaignScreen() {
  const { id, hero: heroParam, back } = useLocalSearchParams<{ id: string; hero?: string; back?: string }>();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const query = useCampaign(id);
  const campaign = query.data;

  // Read the hero rect once; it is cleared from the store so later visits animate normally.
  const [hero] = useState(() => (heroParam ? useHeroStore.getState().take(id) : null));
  const [backOpen, setBackOpen] = useState(back === '1');
  const [overCover, setOverCover] = useState(true);

  // Content fades and rises in behind the flying cover, driven by a shared value on the UI thread.
  const reveal = useSharedValue(hero ? 0 : 1);
  useEffect(() => {
    if (hero) reveal.set(withDelay(140, withTiming(1, { duration: duration.slow, easing: easing.enter })));
  }, [hero, reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: [{ translateY: (1 - reveal.get()) * 24 }],
  }));

  const coverHeight = Math.round(width * 1.02);
  const scrollY = useSharedValue(0);
  const fundingBottom = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const headerThreshold = coverHeight - insets.top - HEADER - 40;
  useAnimatedReaction(
    () => scrollY.get() < headerThreshold,
    (now, prev) => {
      if (now !== prev) scheduleOnRN(setOverCover, now);
    },
  );

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [headerThreshold, headerThreshold + 40], [0, 1], 'clamp'),
  }));
  const stickyVisible = useDerivedValue((): number =>
    fundingBottom.get() > 0 && scrollY.get() > fundingBottom.get() - insets.top - HEADER ? 1 : 0,
  );

  const canBack = campaign ? acceptsContributions(campaign.status) : false;
  const image = campaign?.cover ?? hero?.image ?? null;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={overCover ? 'light' : scheme === 'dark' ? 'light' : 'dark'} animated />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + (canBack ? 120 : space['4xl']) }}>
        <HeroCover
          image={image}
          category={campaign?.category ?? 'other'}
          height={coverHeight}
          scrollY={scrollY}
          hero={hero?.rect ?? null}
        />
        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.bg }, revealStyle]}>
          {campaign ? (
            <CampaignBody
              campaign={campaign}
              onBack={() => setBackOpen(true)}
              onFundingLayout={(bottom) => fundingBottom.set(coverHeight - space.xxl + bottom)}
            />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
          ) : (
            <BodySkeleton />
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating header: buttons always visible; the bar fades in once the cover scrolls away. */}
      <View pointerEvents="box-none" style={[styles.header, { paddingTop: insets.top, height: insets.top + HEADER }]}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.headerBg, { backgroundColor: colors.bg, borderBottomColor: colors.border }, headerBgStyle]}
        />
        <IconButton icon={ArrowLeftIcon} accessibilityLabel="Back" variant="surface" onPress={() => router.back()} />
        <Animated.View style={[styles.headerTitle, headerBgStyle]} pointerEvents="none">
          <Text variant="title3" numberOfLines={1} importantForAccessibility="no">
            {campaign?.title ?? ''}
          </Text>
        </Animated.View>
        <IconButton
          icon={ShareNetworkIcon}
          accessibilityLabel="Share campaign"
          variant="surface"
          disabled={!campaign}
          onPress={() => campaign && void shareCampaign(campaign)}
        />
      </View>

      {campaign && canBack && (
        <>
          <StickyBackBar campaign={campaign} visible={stickyVisible} onBack={() => setBackOpen(true)} />
          <BackPreviewSheet campaign={campaign} open={backOpen} onClose={() => setBackOpen(false)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  sheet: {
    marginTop: -space.xxl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.xxl,
    gap: layout.sectionGap,
  },
  gutter: { paddingHorizontal: layout.gutter },
  titleBlock: { paddingHorizontal: layout.gutter, gap: space.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  creator: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  storyBlock: { gap: space.lg },
  lede: { paddingHorizontal: layout.gutter, fontFamily: fonts.serifItalic },
  section: { paddingHorizontal: layout.gutter, gap: space.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: layout.cardPadding },
  actionIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  update: { gap: space.xs },
  accordions: {},
  accordionCard: { paddingHorizontal: layout.cardPadding },
  footnote: { paddingHorizontal: layout.gutter },
  skeleton: { paddingHorizontal: layout.gutter, gap: space.sm },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    gap: space.md,
  },
  headerBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { flex: 1, alignItems: 'center' },
});
