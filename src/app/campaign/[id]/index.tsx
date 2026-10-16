import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { BodySkeleton, CampaignDetailView } from '@/components/campaign/detail/campaign-detail-view';
import { ErrorState } from '@/components/ui/states';
import { useCampaign } from '@/features/campaigns/queries';
import { useHeroStore } from '@/stores/hero';

export default function CampaignScreen() {
  const { id, hero: heroParam } = useLocalSearchParams<{ id: string; hero?: string }>();
  const query = useCampaign(id);
  // Read the hero rect once; it is cleared from the store so later visits animate normally.
  const [hero] = useState(() => (heroParam ? useHeroStore.getState().take(id) : null));
  return (
    <CampaignDetailView
      campaign={query.data}
      hero={hero}
      placeholder={
        query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
        ) : (
          <BodySkeleton />
        )
      }
    />
  );
}
