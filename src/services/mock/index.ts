import type { Services } from '../contracts';
import { mockAuthService } from './auth';
import { mockCampaignService } from './campaigns';
import { db } from './db';
import { networkControls } from './network';

export function createMockServices(): Services {
  return {
    auth: mockAuthService,
    campaigns: mockCampaignService,
    dev: {
      available: true,
      getNetwork: networkControls.get,
      setNetwork: networkControls.set,
      failNext: networkControls.failNext,
      resetDemoData: () => db.reset(),
    },
  };
}
