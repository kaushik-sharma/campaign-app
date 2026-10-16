import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CampaignFeedback, CampaignListParams, Engagement } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/auth-provider';
import { services } from '@/services';

type ListParams = Omit<CampaignListParams, 'cursor'>;

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: ListParams) => [...campaignKeys.lists(), params] as const,
  featured: () => [...campaignKeys.all, 'featured'] as const,
  home: () => [...campaignKeys.all, 'home'] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
  feedback: (id: string) => [...campaignKeys.all, 'feedback', id] as const,
  engagement: (id: string, userId: string | null) => [...campaignKeys.all, 'engagement', id, userId] as const,
  forMe: (kind: string, userId: string | null) => [...campaignKeys.all, 'for-me', kind, userId] as const,
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

export function useHomeFeed() {
  return useQuery({
    queryKey: campaignKeys.home(),
    queryFn: ({ signal }) => services.campaigns.home({ signal }),
  });
}

export function useCampaignFeedback(id: string) {
  return useQuery({
    queryKey: campaignKeys.feedback(id),
    queryFn: ({ signal }) => services.campaigns.getFeedback(id, { signal }),
  });
}

export function useSubmitFeedback(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedback: CampaignFeedback) => services.campaigns.submitFeedback(id, feedback),
    onSuccess: (saved) => queryClient.setQueryData(campaignKeys.feedback(id), saved),
  });
}

/** Follow / save state. Keyed by user so signing in or out never shows another account's state. */
export function useEngagement(id: string) {
  const userId = useCurrentUser()?.id ?? null;
  return useQuery({
    queryKey: campaignKeys.engagement(id, userId),
    queryFn: ({ signal }) => services.campaigns.getEngagement(id, { signal }),
  });
}

/** Optimistic: the toggle flips instantly and rolls back if the request fails. */
export function useSetEngagement(id: string) {
  const queryClient = useQueryClient();
  const userId = useCurrentUser()?.id ?? null;
  const key = campaignKeys.engagement(id, userId);
  return useMutation({
    mutationFn: (patch: Partial<Engagement>) => services.campaigns.setEngagement(id, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Engagement>(key);
      queryClient.setQueryData<Engagement>(key, (e) => ({ following: false, saved: false, ...e, ...patch }));
      return { previous };
    },
    onError: (_error, _patch, context) => queryClient.setQueryData(key, context?.previous),
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
    // Also refresh other users' keys: an action started as a guest finishes after sign-in.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [...campaignKeys.all, 'engagement', id] });
      void queryClient.invalidateQueries({ queryKey: [...campaignKeys.all, 'for-me'] });
    },
  });
}

/** Campaigns I backed, follow or saved. */
export function useMyCampaignList(kind: 'backed' | 'following' | 'saved') {
  const userId = useCurrentUser()?.id ?? null;
  return useQuery({
    queryKey: campaignKeys.forMe(kind, userId),
    queryFn: ({ signal }) => services.campaigns.listForMe(kind, { signal }),
  });
}
