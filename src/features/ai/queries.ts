import { useMutation } from '@tanstack/react-query';

import type { VoiceAnswers } from '@/domain/draft';
import type { CategoryId } from '@/domain/types';
import { services } from '@/services';

export function useSuggestBasics() {
  return useMutation({
    mutationFn: (input: { title: string; summary: string; category: CategoryId | null; storyText: string }) =>
      services.ai.suggestBasics(input),
  });
}

export function useDraftFromAnswers() {
  return useMutation({ mutationFn: (answers: VoiceAnswers) => services.ai.draftFromAnswers(answers) });
}

export function useGenerateImages() {
  return useMutation({
    mutationFn: (input: { category: CategoryId | null; count: number }) => services.ai.generateImages(input),
  });
}
