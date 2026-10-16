import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ActivityGroup } from '@/domain/types';
import { zustandStorage } from '@/lib/storage';

export type AppearancePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  appearance: AppearancePreference;
  haptics: boolean;
  /** Backer names are private by default (PRD). */
  showNameWhenBacking: boolean;
  /** In-app notifications per Activity group. Push and email aren't part of the prototype. */
  notifications: Record<ActivityGroup, boolean>;
  setNotification: (group: ActivityGroup, enabled: boolean) => void;
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
      notifications: { mine: true, backed: true, following: true, account: true },
      setNotification: (group, enabled) => set((st) => ({ notifications: { ...st.notifications, [group]: enabled } })),
      setAppearance: (appearance) => set({ appearance }),
      setHaptics: (haptics) => set({ haptics }),
      setShowNameWhenBacking: (showNameWhenBacking) => set({ showNameWhenBacking }),
    }),
    {
      name: 'prefs:v1',
      storage: zustandStorage,
      partialize: ({ appearance, haptics, showNameWhenBacking, notifications }) => ({
        appearance,
        haptics,
        showNameWhenBacking,
        notifications,
      }),
      // Older saved preferences have no notification settings; keep the defaults for those.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PreferencesState>;
        return { ...current, ...saved, notifications: { ...current.notifications, ...saved.notifications } };
      },
    },
  ),
);
