import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Draft, DraftPatch } from '@/domain/draft';
import { activityKeys } from '@/features/activity/queries';
import { campaignKeys } from '@/features/campaigns/queries';
import { creatorKeys } from '@/features/creator/queries';
import { services } from '@/services';

export const draftKeys = {
  all: ['drafts'] as const,
  list: () => [...draftKeys.all, 'list'] as const,
  detail: (id: string) => [...draftKeys.all, 'detail', id] as const,
};

export function useDrafts() {
  return useQuery({ queryKey: draftKeys.list(), queryFn: ({ signal }) => services.drafts.list({ signal }) });
}

/** The editor reads a draft once and then owns it locally, so background refetches never clobber typing. */
export function useDraft(id: string) {
  return useQuery({
    queryKey: draftKeys.detail(id),
    queryFn: ({ signal }) => services.drafts.get(id, { signal }),
    staleTime: Infinity,
    refetchOnMount: 'always',
  });
}

/** The preview shows exactly what the editor handed it (see `showPreview`), without refetching. */
export function usePreviewDraft(id: string) {
  return useQuery({
    queryKey: draftKeys.detail(id),
    queryFn: ({ signal }) => services.drafts.get(id, { signal }),
    staleTime: Infinity,
    refetchOnMount: false,
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { origin: Draft['origin']; patch?: DraftPatch }) => services.drafts.create(input),
    onSuccess: (draft) => {
      queryClient.setQueryData(draftKeys.detail(draft.id), draft);
      void queryClient.invalidateQueries({ queryKey: draftKeys.list() });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services.drafts.remove(id),
    onSuccess: (_r, id) => {
      queryClient.removeQueries({ queryKey: draftKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: draftKeys.list() });
    },
  });
}

/** Saves the latest local edits first, so the server validates exactly what the creator sees. */
export function useSubmitDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Draft) => {
      await services.drafts.save(draft);
      return services.drafts.submit(draft.id);
    },
    onSuccess: (campaign) => {
      queryClient.setQueryData(creatorKeys.detail(campaign.id), campaign);
      void queryClient.invalidateQueries({ queryKey: draftKeys.all });
      void queryClient.invalidateQueries({ queryKey: creatorKeys.all });
      void queryClient.invalidateQueries({ queryKey: activityKeys.all });
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}
