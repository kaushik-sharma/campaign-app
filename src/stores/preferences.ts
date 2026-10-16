import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

export type AppearancePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  appearance: AppearancePreference;
  haptics: boolean;
  /** Backer names are private by default (PRD). */
  showNameWhenBacking: boolean;
  setAppearance: (appearance: AppearancePreference) => void;
  setHaptics: (enabled: boolean) => void;
  setShowNameWhenBacking: (enabled: boolean) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      appearance: 'system',
      haptics: true,
      showNameWhenBacking: false,
      setAppearance: (appearance) => set({ appearance }),
      setHaptics: (haptics) => set({ haptics }),
      setShowNameWhenBacking: (showNameWhenBacking) => set({ showNameWhenBacking }),
    }),
    {
      name: 'prefs:v1',
      storage: zustandStorage,
      partialize: ({ appearance, haptics, showNameWhenBacking }) => ({
        appearance,
        haptics,
        showNameWhenBacking,
      }),
    },
  ),
);
