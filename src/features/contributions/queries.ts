import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CheckoutInput, Contribution } from '@/domain/types';
import { campaignKeys } from '@/features/campaigns/queries';
import { activityKeys } from '@/features/activity/queries';
import { services } from '@/services';

export const contributionKeys = {
  all: ['contributions'] as const,
  mine: () => [...contributionKeys.all, 'mine'] as const,
  detail: (id: string) => [...contributionKeys.all, 'detail', id] as const,
};

/** Refreshes everything a payment can change: totals on every campaign surface, history and activity. */
export function invalidateAfterPayment(queryClient: ReturnType<typeof useQueryClient>, c: Contribution) {
  queryClient.setQueryData(contributionKeys.detail(c.id), c);
  void queryClient.invalidateQueries({ queryKey: contributionKeys.mine() });
  void queryClient.invalidateQueries({ queryKey: activityKeys.all });
  if (c.status === 'succeeded') void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => services.contributions.checkout(input),
    onSuccess: (c) => invalidateAfterPayment(queryClient, c),
  });
}

/** One payment. While it is pending, polls until the server confirms it. */
export function useContribution(id: string | null, { poll = false }: { poll?: boolean } = {}) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: contributionKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async ({ signal }) => {
      const previous = queryClient.getQueryData<Contribution>(contributionKeys.detail(id!));
      const next = await services.contributions.get(id!, { signal });
      if (previous && previous.status !== next.status) invalidateAfterPayment(queryClient, next);
      return next;
    },
    refetchInterval: (query) => (poll && query.state.data?.status === 'pending' ? 2000 : false),
  });
}

export function useMyContributions() {
  return useQuery({
    queryKey: contributionKeys.mine(),
    queryFn: ({ signal }) => services.contributions.listMine({ signal }),
  });
}
