import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { CampaignListParams } from '@/domain/types';
import { services } from '@/services';

type ListParams = Omit<CampaignListParams, 'cursor'>;

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: ListParams) => [...campaignKeys.lists(), params] as const,
  featured: () => [...campaignKeys.all, 'featured'] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaignFeed(params: ListParams = {}) {
  return useInfiniteQuery({
    queryKey: campaignKeys.list(params),
    queryFn: ({ pageParam, signal }) =>
      services.campaigns.list({ ...params, cursor: pageParam }, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useFeaturedCampaigns() {
  return useQuery({
    queryKey: campaignKeys.featured(),
    queryFn: ({ signal }) => services.campaigns.featured({ signal }),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: ({ signal }) => services.campaigns.get(id, { signal }),
  });
}
