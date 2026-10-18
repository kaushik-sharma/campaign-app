import type { User } from '@/domain/types';

import type { AuthService, Services } from '../contracts';
import { mockAuthService } from './auth';
import { mockCampaignService } from './campaigns';
import { mockAiService } from './ai';
import { mockActivityService, mockContributionService } from './contributions';
import { mockCreatorService, mockDraftService } from './drafts';
import { advanceNow, lifecycleControls } from './lifecycle';
import { mockReportService, triggerNotification } from './notifications';
import { db } from './db';
import { addEvent } from './events';
import { networkControls } from './network';
import { dataUser, setSessionSource } from './session';

/** Account activity: a welcome on sign-up, and a note for each new sign-in. */
async function recordAccountEvent(user: User, kind: 'welcome' | 'sign-in') {
  await db.ready();
  addEvent(dataUser(user).id, {
    campaignId: '',
    group: 'account',
    link: { screen: 'profile' },
    kind,
    title: kind === 'welcome' ? 'Welcome to Campaigns' : 'New sign-in',
    body:
      kind === 'welcome'
        ? 'Follow campaigns to get their milestones here, and create your own from the Create tab.'
        : 'Your account was signed in on this device. If this wasn’t you, change your password.',
  });
}

function withAccountEvents(auth: AuthService): AuthService {
  return {
    ...auth,
    async signIn(input) {
      const session = await auth.signIn(input);
      await recordAccountEvent(session.user, 'sign-in');
      return session;
    },
    async signUp(input) {
      const session = await auth.signUp(input);
      await recordAccountEvent(session.user, 'welcome');
      return session;
    },
  };
}

/**
 * Sample-data services on the device. `auth` can be a real backend (Firebase): the sample data then
 * belongs to whoever is signed in there.
 */
export function createMockServices(auth: AuthService = mockAuthService): Services {
  setSessionSource(auth);
  return {
    auth: withAccountEvents(auth),
    campaigns: mockCampaignService,
    contributions: mockContributionService,
    activity: mockActivityService,
    drafts: mockDraftService,
    creator: mockCreatorService,
    ai: mockAiService,
    reports: mockReportService,
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
      triggerNotification,
    },
  };
}
