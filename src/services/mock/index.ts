import type { Services } from '../contracts';
import { mockAuthService } from './auth';
import { mockCampaignService } from './campaigns';
import { mockAiService } from './ai';
import { mockActivityService, mockContributionService } from './contributions';
import { mockCreatorService, mockDraftService } from './drafts';
import { advanceNow, lifecycleControls } from './lifecycle';
import { db } from './db';
import { networkControls } from './network';

export function createMockServices(): Services {
  return {
    auth: mockAuthService,
    campaigns: mockCampaignService,
    contributions: mockContributionService,
    activity: mockActivityService,
    drafts: mockDraftService,
    creator: mockCreatorService,
    ai: mockAiService,
    dev: {
      available: true,
      getNetwork: networkControls.get,
      setNetwork: networkControls.set,
      failNext: networkControls.failNext,
      resetDemoData: () => db.reset(),
      getLifecycle: lifecycleControls.get,
      setLifecycle: lifecycleControls.set,
      advanceCampaign: async (id) => {
        await db.ready();
        return advanceNow(id);
      },
    },
  };
}
