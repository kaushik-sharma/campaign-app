import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { CampaignCard, CampaignCardSkeleton } from '@/components/campaign/campaign-card';
import { activeFilterCount, FilterSheet, SORT_OPTIONS, SortSheet } from '@/components/campaign/explore-sheets';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { ArrowsDownUpIcon, MagnifyingGlassIcon, SlidersHorizontalIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { categories } from '@/domain/categories';
import type { CampaignFilters, CampaignSort, CategoryId } from '@/domain/types';
import { campaignKeys, useCampaignFeed } from '@/features/campaigns/queries';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { layout, radius, space, spring, useTheme } from '@/theme';

const listTransition = LinearTransition.springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness);

function ToolbarButton({
  label,
  onPress,
  count,
  icon: Icon,
}: {
  label: string;
  onPress: () => void;
  count?: number;
  icon: typeof SlidersHorizontalIcon;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.95}
      accessibilityLabel={count ? `${label}, ${count} active` : label}
      style={[styles.toolbarButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Icon size={16} color={colors.text} />
      <Text variant="subhead" maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      {count ? (
        <View style={[styles.count, { backgroundColor: colors.primary }]}>
          <Text variant="caption" color="onPrimary" maxFontSizeMultiplier={1}>
            {count}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

/**
 * Explore: the full catalogue. Search, categories, sort and filters all go to the (mock) server,
 * so results, counts and pagination behave like a real backend.
 */
export default function ExploreScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [sort, setSort] = useState<CampaignSort>('trending');
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const feed = useCampaignFeed({ query: debouncedQuery, category, sort, filters });
  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const total = feed.data?.pages[0]?.total ?? 0;
  const filterCount = activeFilterCount(filters);
  const narrowed = Boolean(debouncedQuery || category || filterCount);

  const clearAll = () => {
    setQuery('');
    setCategory(null);
    setFilters({});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: campaignKeys.lists() });
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (feed.hasNextPage && !feed.isFetchingNextPage && !feed.isFetchNextPageError) void feed.fetchNextPage();
  };

  let results: React.ReactNode;
  if (feed.isPending) {
    results = (
      <SkeletonGroup style={styles.list} label="Loading campaigns">
        <CampaignCardSkeleton />
        <CampaignCardSkeleton />
      </SkeletonGroup>
    );
  } else if (feed.isError && items.length === 0) {
    results = <ErrorState error={feed.error} onRetry={() => void feed.refetch()} retrying={feed.isRefetching} />;
  } else if (items.length === 0) {
    results = narrowed ? (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="No campaigns match"
        message={debouncedQuery ? `Nothing found for “${debouncedQuery}”. Try fewer words or another category.` : 'Try removing a filter or choosing another category.'}
        action={{ label: 'Clear search and filters', onPress: clearAll }}
      />
    ) : (
      <EmptyState icon={MagnifyingGlassIcon} title="No campaigns yet" message="Reviewed campaigns will appear here." />
    );
  } else {
    results = (
      <Animated.View layout={listTransition} style={styles.list}>
        {items.map((c, i) => (
          <CampaignCard key={c.id} campaign={c} index={i % 8} />
        ))}
        {feed.isFetchingNextPage && <ActivityIndicator style={styles.more} />}
        {feed.isFetchNextPageError && (
          <ErrorState error={feed.error} onRetry={() => void feed.fetchNextPage()} compact />
        )}
        {!feed.hasNextPage && items.length > 3 && (
          <Text variant="footnote" color="textMuted" align="center" style={styles.more}>
            You’ve seen all {total} campaigns.
          </Text>
        )}
      </Animated.View>
    );
  }

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort';

  return (
    <Screen title="Explore" onRefresh={onRefresh} refreshing={refreshing} onEndReached={onEndReached}>
      <View style={styles.search}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search campaigns, creators, places" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
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

      <View style={styles.toolbar}>
        <View style={styles.countRow} accessible accessibilityLabel={`${total} campaigns`}>
          {feed.isPending ? (
            <Text variant="subhead" color="textMuted">
              Loading…
            </Text>
          ) : (
            <>
              <AnimatedNumber value={total} variant="subhead" animateOnMount={false} />
              <Text variant="subhead" color="textMuted">
                {total === 1 ? 'campaign' : 'campaigns'}
              </Text>
            </>
          )}
        </View>
        <ToolbarButton label={sortLabel} icon={ArrowsDownUpIcon} onPress={() => setSortOpen(true)} />
        <ToolbarButton label="Filters" icon={SlidersHorizontalIcon} count={filterCount} onPress={() => setFiltersOpen(true)} />
      </View>

      {filterCount > 0 && (
        <View style={styles.activeFilters}>
          <Badge label={`${filterCount} filter${filterCount > 1 ? 's' : ''} applied`} tone="info" />
          <PressableScale onPress={() => setFilters({})} scaleTo={0.95} accessibilityLabel="Clear filters" hitSlop={10}>
            <Text variant="subhead" color="primary">
              Clear
            </Text>
          </PressableScale>
        </View>
      )}

      <View style={styles.results}>{results}</View>

      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} value={filters} onApply={setFilters} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: layout.gutter, marginBottom: space.md },
  chipRow: { flexGrow: 0, marginBottom: space.lg },
  chips: { gap: space.sm, paddingHorizontal: layout.gutter },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: layout.gutter,
    marginBottom: space.md,
  },
  countRow: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  count: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  activeFilters: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter, marginBottom: space.md },
  results: { paddingHorizontal: layout.gutter },
  list: { gap: space.lg },
  more: { paddingVertical: space.lg },
});
