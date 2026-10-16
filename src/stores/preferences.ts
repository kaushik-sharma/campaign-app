import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

export type AppearancePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  appearance: AppearancePreference;
  haptics: boolean;
  /** Backer names are private by default (PRD). */
  showNameWhenBacking: boolean;
  /** The one-time "How it works" card on Home. */
  introDismissed: boolean;
  setAppearance: (appearance: AppearancePreference) => void;
  setHaptics: (enabled: boolean) => void;
  setShowNameWhenBacking: (enabled: boolean) => void;
  dismissIntro: () => void;
  resetIntro: () => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      appearance: 'system',
      haptics: true,
      showNameWhenBacking: false,
      introDismissed: false,
      setAppearance: (appearance) => set({ appearance }),
      setHaptics: (haptics) => set({ haptics }),
      setShowNameWhenBacking: (showNameWhenBacking) => set({ showNameWhenBacking }),
      dismissIntro: () => set({ introDismissed: true }),
      resetIntro: () => set({ introDismissed: false }),
    }),
    {
      name: 'prefs:v1',
      storage: zustandStorage,
      partialize: ({ appearance, haptics, showNameWhenBacking, introDismissed }) => ({
        appearance,
        haptics,
        showNameWhenBacking,
        introDismissed,
      }),
    },
  ),
);
