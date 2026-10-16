import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ActivityEvent } from '@/domain/types';
import { services } from '@/services';

export const activityKeys = {
  all: ['activity'] as const,
  list: () => [...activityKeys.all, 'list'] as const,
};

export function useActivity() {
  return useQuery({
    queryKey: activityKeys.list(),
    queryFn: ({ signal }) => services.activity.list({ signal }),
  });
}

export function useMarkActivityRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => services.activity.markAllRead(),
    onSuccess: () =>
      queryClient.setQueryData<ActivityEvent[]>(activityKeys.list(), (events) =>
        events?.map((e) => ({ ...e, read: true })),
      ),
  });
}
