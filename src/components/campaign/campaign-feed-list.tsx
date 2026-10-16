import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon } from '@/components/ui/icons';
import { SkeletonGroup } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useCampaignFeed } from '@/features/campaigns/queries';
import { space } from '@/theme';

import { CampaignRow, CampaignRowSkeleton } from './campaign-row';

type Props = {
  params: Parameters<typeof useCampaignFeed>[0];
  emptyTitle?: string;
  emptyMessage?: string;
};

/** Paginated campaign list with loading, empty, error and load-more states. */
export function CampaignFeedList({ params, emptyTitle = 'No campaigns yet', emptyMessage }: Props) {
  const feed = useCampaignFeed(params);
  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];

  if (feed.isPending) {
    return (
      <SkeletonGroup style={styles.list} label="Loading campaigns">
        {[0, 1, 2].map((i) => (
          <CampaignRowSkeleton key={i} />
        ))}
      </SkeletonGroup>
    );
  }

  if (feed.isError && items.length === 0) {
    return <ErrorState error={feed.error} onRetry={() => void feed.refetch()} retrying={feed.isRefetching} compact />;
  }

  if (items.length === 0) {
    return <EmptyState icon={MagnifyingGlassIcon} title={emptyTitle} message={emptyMessage} compact />;
  }

  return (
    <View style={styles.list}>
      {items.map((c, i) => (
        <CampaignRow key={c.id} campaign={c} index={i % 8} />
      ))}
      {feed.isFetchNextPageError && (
        <ErrorState error={feed.error} onRetry={() => void feed.fetchNextPage()} compact />
      )}
      {feed.hasNextPage && !feed.isFetchNextPageError && (
        <Button
          label="Load more"
          variant="secondary"
          fullWidth
          loading={feed.isFetchingNextPage}
          onPress={() => void feed.fetchNextPage()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
});
