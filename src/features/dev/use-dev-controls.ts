import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { statusMeta } from '@/domain/lifecycle';
import type { ActivityKind } from '@/domain/types';
import { activityKeys } from '@/features/activity/queries';
import { services, type LifecycleSettings, type NetworkSettings } from '@/services';

/** Demo controls for simulating backend behaviour during a demo. */
export function useDevControls() {
  const queryClient = useQueryClient();
  const [network, setNetworkState] = useState<NetworkSettings>(() => services.dev.getNetwork());
  const [lifecycle, setLifecycleState] = useState<LifecycleSettings>(() => services.dev.getLifecycle());

  return {
    available: services.dev.available,
    network,
    setNetwork(patch: Partial<NetworkSettings>) {
      services.dev.setNetwork(patch);
      setNetworkState(services.dev.getNetwork());
    },
    failNext: services.dev.failNext,
    lifecycle,
    setLifecycle(patch: Partial<LifecycleSettings>) {
      services.dev.setLifecycle(patch);
      setLifecycleState(services.dev.getLifecycle());
    },
    /** Steps a campaign (default: the newest in review) forward; returns a message for a toast. */
    async advanceCampaign(id?: string): Promise<string> {
      const moved = await services.dev.advanceCampaign(id);
      // Status changes touch discovery, the creator's views and Activity.
      await queryClient.invalidateQueries();
      return moved ? `Moved to “${statusMeta[moved.status].label}”` : id ? 'This campaign is at its final stage' : 'No submitted campaigns waiting';
    },
    async triggerNotification(kind: ActivityKind) {
      await services.dev.triggerNotification(kind);
      await queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
    async resetDemoData() {
      await services.dev.resetDemoData();
      queryClient.clear();
    },
  };
}
