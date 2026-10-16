import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { services, type NetworkSettings } from '@/services';

/** Demo controls for simulating backend behaviour during a demo. */
export function useDevControls() {
  const queryClient = useQueryClient();
  const [network, setNetworkState] = useState<NetworkSettings>(() => services.dev.getNetwork());

  return {
    available: services.dev.available,
    network,
    setNetwork(patch: Partial<NetworkSettings>) {
      services.dev.setNetwork(patch);
      setNetworkState(services.dev.getNetwork());
    },
    failNext: services.dev.failNext,
    async resetDemoData() {
      await services.dev.resetDemoData();
      queryClient.clear();
    },
  };
}
