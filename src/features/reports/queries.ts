import { useQuery } from '@tanstack/react-query';

import { services } from '@/services';

export const reportKeys = {
  all: ['reports'] as const,
  detail: (id: string) => [...reportKeys.all, id] as const,
};

/** A campaign's delivery report. Refreshes every 30 s while ads are running. */
export function useReport(campaignId: string) {
  return useQuery({
    queryKey: reportKeys.detail(campaignId),
    queryFn: ({ signal }) => services.reports.get(campaignId, { signal }),
    refetchInterval: (query) => (query.state.data?.phase === 'delivering' ? 30_000 : false),
  });
}
