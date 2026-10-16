import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CampaignFeedList } from '@/components/campaign/campaign-feed-list';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { categories } from '@/domain/categories';
import type { CategoryId } from '@/domain/types';
import { layout, space } from '@/theme';

/** Phase 1 explore: category browsing against the mock service. Search, sort and filters land in Phase 2. */
export default function ExploreScreen() {
  const [category, setCategory] = useState<CategoryId | null>(null);

  return (
    <Screen title="Explore">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipRow}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            selected={category === c.id}
            onPress={() => setCategory(category === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.list}>
        <CampaignFeedList
          params={{ category, sort: 'trending' }}
          emptyTitle="No campaigns in this category yet"
          emptyMessage="Try another category, or check back soon."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexGrow: 0, marginBottom: space.xl },
  chips: { gap: space.sm, paddingHorizontal: layout.gutter },
  list: { paddingHorizontal: layout.gutter },
});
