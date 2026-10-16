import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { statusMeta } from '@/domain/lifecycle';
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
    /** Steps the newest campaign in review forward; returns a message for a toast. */
    async advanceCampaign(): Promise<string> {
      const moved = await services.dev.advanceCampaign();
      // Status changes touch discovery, the creator's views and Activity.
      await queryClient.invalidateQueries();
      return moved ? `Moved to “${statusMeta[moved.status].label}”` : 'No submitted campaigns waiting';
    },
    async resetDemoData() {
      await services.dev.resetDemoData();
      queryClient.clear();
    },
  };
}
