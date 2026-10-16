import { QueryClient } from '@tanstack/react-query';

import { isServiceError } from '@/services';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      // One silent retry for transient failures; persistent failures surface an error state.
      retry: (count, error) => count < 1 && (!isServiceError(error) || error.retryable),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
