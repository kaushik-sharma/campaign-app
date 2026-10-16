import { useQuery } from '@tanstack/react-query';

import type { CampaignStatus } from '@/domain/lifecycle';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { services } from '@/services';

export const creatorKeys = {
  all: ['creator'] as const,
  list: () => [...creatorKeys.all, 'list'] as const,
  detail: (id: string) => [...creatorKeys.all, 'detail', id] as const,
  draftFor: (id: string) => [...creatorKeys.all, 'draft-for', id] as const,
};

/** Statuses the simulator will still move on its own. */
const MOVING: CampaignStatus[] = ['submitted', 'approved'];

export function useMyCampaigns() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: [...creatorKeys.list(), user?.id ?? null],
    queryFn: ({ signal }) => services.creator.listCampaigns({ signal }),
    enabled: !!user,
    refetchInterval: (query) => (query.state.data?.some((c) => MOVING.includes(c.status)) ? 4000 : false),
  });
}

/** One of my campaigns. Polls while review is in progress so the timeline moves live. */
export function useMyCampaign(id: string) {
  return useQuery({
    queryKey: creatorKeys.detail(id),
    queryFn: ({ signal }) => services.creator.getCampaign(id, { signal }),
    refetchInterval: (query) => (query.state.data && MOVING.includes(query.state.data.status) ? 3000 : false),
  });
}

export function useDraftForCampaign(id: string, enabled: boolean) {
  return useQuery({
    queryKey: creatorKeys.draftFor(id),
    queryFn: ({ signal }) => services.creator.draftFor(id, { signal }),
    enabled,
  });
}
