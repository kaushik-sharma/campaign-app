import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { CampaignRow } from '@/components/campaign/campaign-row';
import { LeadStoryCard, LeadStorySkeleton } from '@/components/campaign/lead-story-card';
import { Rail, RailSkeleton } from '@/components/campaign/rail';
import { Screen } from '@/components/ui/screen';
import { SkeletonGroup } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { campaignKeys, useHomeFeed } from '@/features/campaigns/queries';
import { duration, layout, space, spring } from '@/theme';

const layoutTransition = LinearTransition.springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness);

/**
 * Home is a curated front page, not a catalogue: one lead story, then a few short sections.
 * No pitch, no duplicate CTAs.
 */
export default function HomeScreen() {
  const queryClient = useQueryClient();
  const home = useHomeFeed();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: campaignKeys.home() });
    setRefreshing(false);
  };

  return (
    <Screen title="Campaigns" brand onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.top} />

      {home.isPending ? (
        <SkeletonGroup label="Loading campaigns">
          <View style={styles.lead}>
            <LeadStorySkeleton />
          </View>
          <RailSkeleton />
        </SkeletonGroup>
      ) : home.isError ? (
        <ErrorState error={home.error} onRetry={() => void home.refetch()} retrying={home.isRefetching} />
      ) : (
        <Animated.View entering={FadeIn.duration(duration.slow)}>
          {home.data.lead && (
            <View style={styles.lead}>
              <LeadStoryCard campaign={home.data.lead} />
            </View>
          )}

          <Animated.View layout={layoutTransition}>
            <Rail
              title="Ending soon"
              description="Funding closes in the next few days."
              items={home.data.endingSoon}
              variant="deadline"
            />
            <Rail
              title="Now promoting"
              description="Funded by backers. Ads are reaching new people."
              items={home.data.nowPromoting}
              variant="promoting"
            />
            {home.data.justLaunched.length > 0 && (
              <View style={styles.section}>
                <Text variant="title2" accessibilityRole="header">
                  Just launched
                </Text>
                <View style={styles.list}>
                  {home.data.justLaunched.map((c, i) => (
                    <CampaignRow key={c.id} campaign={c} index={i} trailing="percent" />
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { height: space.md },
  lead: { paddingHorizontal: layout.gutter, marginBottom: layout.sectionGap },
  section: { paddingHorizontal: layout.gutter, gap: space.md, marginBottom: layout.sectionGap },
  list: { gap: space.md },
});
