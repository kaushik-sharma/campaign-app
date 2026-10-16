import { router } from 'expo-router';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { CampaignSummary } from '@/domain/types';
import { useHeroStore } from '@/stores/hero';

type Options = {
  /** The card's cover view, measured so the detail page can fly the image from it. */
  cover?: RefObject<View | null>;
  /** Corner radius of the card cover, so the transition starts from the same shape. */
  radius?: number;
};

/** Opens the backing flow (amount → review → payment) for a campaign. */
export function openBackFlow(campaignId: string) {
  router.push({ pathname: '/campaign/[id]/back', params: { id: campaignId } });
}

/** Opens a campaign's detail page, with the hero transition when a cover is provided. */
export function useOpenCampaign() {
  const reduced = useReducedMotion();
  const start = useHeroStore((s) => s.start);

  return (campaign: CampaignSummary, { cover, radius = 0 }: Options = {}) => {
    const go = (hero: boolean) =>
      router.push({
        pathname: '/campaign/[id]',
        params: { id: campaign.id, ...(hero ? { hero: '1' } : {}) },
      });

    const node = cover?.current;
    if (reduced || !node) return go(false);
    node.measureInWindow((x, y, width, height) => {
      if (!width || !height) return go(false);
      start(campaign.id, { x, y, width, height, radius }, campaign.cover);
      go(true);
    });
  };
}
