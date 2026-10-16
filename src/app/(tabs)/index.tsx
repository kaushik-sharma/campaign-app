import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampaignFeedList } from '@/components/campaign/campaign-feed-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DemoBadge, EstimatedReach } from '@/components/ui/estimate';
import { ArrowRightIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { campaignKeys } from '@/features/campaigns/queries';
import { layout, space } from '@/theme';

/** Phase 1 home: the promise, the next actions and a live feed from the mock service. */
export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: campaignKeys.all });
    setRefreshing(false);
  };

  return (
    <Screen title="Campaigns" eyebrow="Community-funded reach" onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.hero}>
        <Card padded={false} elevation="e2">
          <View style={styles.heroBody}>
            <Text variant="title1">Help important messages travel further.</Text>
            <Text variant="body" color="textMuted">
              Creators publish a message. We review it. Backers pool contributions that pay for ads,
              so the message reaches people beyond the creator’s own network.
            </Text>
            <View style={styles.reach}>
              <Text variant="caption" color="textMuted">
                A $10 contribution reaches
              </Text>
              <EstimatedReach amountCents={1_000} variant="bodyStrong" />
            </View>
            <View style={styles.actions}>
              <Button label="Explore campaigns" fullWidth onPress={() => router.navigate('/explore')} />
              <Button
                label="Start a campaign"
                variant="secondary"
                fullWidth
                icon={ArrowRightIcon}
                iconPosition="trailing"
                onPress={() => router.navigate('/create')}
              />
            </View>
          </View>
        </Card>
        <Text variant="footnote" color="textMuted" style={styles.note}>
          Contributions pay for advertising that spreads the message. They aren’t donations to the
          cause or the creator.
        </Text>
      </View>

      <Section title="Campaign feed" description="Reviewed campaigns from creators and organizations.">
        <View style={styles.demo}>
          <DemoBadge />
        </View>
        <CampaignFeedList params={{ sort: 'trending' }} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: layout.gutter, marginBottom: layout.sectionGap, gap: space.md },
  heroBody: { padding: space.xl, gap: space.lg },
  reach: { gap: space.xs },
  actions: { gap: space.sm, marginTop: space.xs },
  note: { paddingHorizontal: space.xs },
  demo: { marginBottom: space.md },
});
