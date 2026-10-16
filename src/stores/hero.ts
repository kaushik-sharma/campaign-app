import { create } from 'zustand';

import type { ImageAsset } from '@/domain/types';

export type HeroRect = { x: number; y: number; width: number; height: number; radius: number };

type HeroState = {
  /** Where the tapped card's cover sits on screen, for the card → detail transition. */
  pending: { id: string; rect: HeroRect; image: ImageAsset | null } | null;
  start: (id: string, rect: HeroRect, image: ImageAsset | null) => void;
  /** Read once by the detail screen; cleared so a later visit animates normally. */
  take: (id: string) => { rect: HeroRect; image: ImageAsset | null } | null;
};

export const useHeroStore = create<HeroState>((set, get) => ({
  pending: null,
  start: (id, rect, image) => set({ pending: { id, rect, image } }),
  take: (id) => {
    const pending = get().pending;
    if (!pending || pending.id !== id) return null;
    set({ pending: null });
    return { rect: pending.rect, image: pending.image };
  },
}));
