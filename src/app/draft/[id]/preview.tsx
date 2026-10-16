import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { BodySkeleton, CampaignDetailView } from '@/components/campaign/detail/campaign-detail-view';
import { ErrorState } from '@/components/ui/states';
import { demo } from '@/config/demo';
import { draftToCampaign } from '@/domain/draft';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { usePreviewDraft } from '@/features/drafts/queries';

/**
 * "Preview campaign": the draft rendered by the same view as a live campaign page, as it will
 * look the moment it opens for backing. Live actions are inert.
 */
export default function DraftPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  const query = usePreviewDraft(id);
  const [now] = useState(() => Date.now());

  const campaign = query.data
    ? {
        ...draftToCampaign(query.data, {
          id: `preview-${id}`,
          creatorId: user?.id ?? 'preview',
          status: 'funding',
          now: new Date(now).toISOString(),
        }),
        publishedAt: new Date(now).toISOString(),
        fundingEndsAt: new Date(now + demo.lifecycle.fundingWindowDays * 86_400_000).toISOString(),
      }
    : undefined;

  return (
    <CampaignDetailView
      campaign={campaign}
      preview
      placeholder={query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : <BodySkeleton />}
    />
  );
}
