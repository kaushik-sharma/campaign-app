import {
  applyDraftPatch,
  DRAFT_STEPS,
  draftStepLabels,
  draftToCampaign,
  emptyContent,
  toDraftSummary,
  validateStep,
  type Draft,
  type FieldErrors,
} from '@/domain/draft';
import type { Campaign, User } from '@/domain/types';

import type { CreatorService, DraftService } from '../contracts';
import { ServiceError } from '../errors';
import { toSummary } from './campaigns';
import { db } from './db';
import { addEvent, notifyStakeholders, randomId } from './events';
import { advanceDue } from './lifecycle';
import { simulateRequest } from './network';
import { currentUser } from './session';

type StoredDraft = Draft & { campaignId: string | null };

/** Guest drafts (no owner) belong to whoever uses this device; account drafts to their owner. */
function visibleTo(d: StoredDraft, user: User | null) {
  return d.ownerId === null || d.ownerId === user?.id;
}

async function findDraft(id: string): Promise<StoredDraft> {
  await db.ready();
  const user = await currentUser();
  const draft = db.getDraft(id);
  if (!draft || !visibleTo(draft, user)) throw new ServiceError('not-found', 'Draft not found');
  return draft;
}

const strip = ({ campaignId: _campaignId, ...draft }: StoredDraft): Draft => draft;

export const mockDraftService: DraftService = {
  list(opts) {
    return simulateRequest(async () => {
      await db.ready();
      const user = await currentUser();
      return db
        .drafts()
        .filter((d) => d.campaignId === null && visibleTo(d, user))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(toDraftSummary);
    }, opts);
  },

  get(id, opts) {
    return simulateRequest(async () => strip(await findDraft(id)), opts);
  },

  create({ origin, patch }) {
    return simulateRequest(async () => {
      await db.ready();
      const user = await currentUser();
      const now = new Date().toISOString();
      const base: StoredDraft = {
        ...emptyContent(),
        id: randomId('d_'),
        ownerId: user?.id ?? null,
        origin,
        step: 'basics',
        createdAt: now,
        updatedAt: now,
        campaignId: null,
      };
      // Pre-fill the creator name for signed-in users; AI patches can never touch the goal.
      const draft = applyDraftPatch(
        user ? { ...base, basics: { ...base.basics, creatorName: user.name } } : base,
        patch ?? {},
      );
      db.putDraft(draft);
      return strip(draft);
    });
  },

  save(draft) {
    return simulateRequest(async () => {
      const existing = await findDraft(draft.id);
      const saved: StoredDraft = {
        ...draft,
        ownerId: existing.ownerId,
        createdAt: existing.createdAt,
        campaignId: existing.campaignId,
        updatedAt: new Date().toISOString(),
      };
      db.putDraft(saved);
      return strip(saved);
    });
  },

  remove(id) {
    return simulateRequest(async () => {
      await findDraft(id);
      db.deleteDraft(id);
    });
  },

  submit(id) {
    return simulateRequest(async () => {
      const draft = await findDraft(id);
      const user = await currentUser();
      if (!user) throw new ServiceError('unauthorized', 'Sign in to submit your campaign for review.');

      // The server re-validates everything; the client's checks are a convenience.
      const errors: FieldErrors = {};
      let firstStep: (typeof DRAFT_STEPS)[number] | null = null;
      for (const step of DRAFT_STEPS) {
        const stepErrors = validateStep(draft, step);
        if (Object.keys(stepErrors).length) {
          firstStep ??= step;
          Object.assign(errors, stepErrors);
        }
      }
      if (firstStep) {
        throw new ServiceError('validation', `Finish ${draftStepLabels[firstStep]} before submitting.`, errors);
      }

      const now = new Date().toISOString();
      const existing = draft.campaignId ? db.tables.campaigns.get(draft.campaignId) : undefined;
      // Resubmission: after changes were requested, or after editing a live campaign (material
      // changes go back to review; money raised so far is kept).
      if (existing && !['changes-requested', 'funding', 'goal-reached'].includes(existing.status)) {
        throw new ServiceError('conflict', 'This campaign can’t be resubmitted in its current state.');
      }
      const campaignId = existing?.id ?? randomId('c_');
      const built = draftToCampaign(draft, {
        id: campaignId,
        creatorId: user.id,
        status: 'submitted',
        now,
        history: [...(existing?.history ?? []), { status: 'submitted', at: now }],
      });
      const campaign: Campaign = existing
        ? { ...built, raisedCents: existing.raisedCents, backerCount: existing.backerCount, updates: existing.updates }
        : built;
      db.putCreatedCampaign(campaign);
      db.putDraft({ ...draft, ownerId: user.id, campaignId, updatedAt: now });
      addEvent(user.id, {
        campaignId,
        opensStatus: true,
        group: 'mine',
        link: { screen: 'manage', id: campaignId },
        kind: 'submitted',
        title: existing ? 'Campaign resubmitted' : 'Campaign submitted for review',
        body: `“${campaign.title}” is with our review team. You’ll hear back here when there’s a decision.`,
      });
      return campaign;
    });
  },
};

async function ownCampaign(id: string): Promise<Campaign> {
  await db.ready();
  advanceDue();
  const user = await currentUser();
  const campaign = db.tables.campaigns.get(id);
  if (!user) throw new ServiceError('unauthorized', 'Sign in to see your campaigns.');
  if (!campaign || db.ownerOf(id) !== user.id) throw new ServiceError('not-found', 'Campaign not found');
  return campaign;
}

export const mockCreatorService: CreatorService = {
  listCampaigns(opts) {
    return simulateRequest(async () => {
      await db.ready();
      advanceDue();
      const user = await currentUser();
      if (!user) return [];
      const lastChange = (c: Campaign) => c.history.at(-1)?.at ?? c.submittedAt ?? '';
      return db
        .campaignsOwnedBy(user.id)
        .sort((a, b) => lastChange(b).localeCompare(lastChange(a)))
        .map(toSummary);
    }, opts);
  },

  getCampaign(id, opts) {
    return simulateRequest(() => ownCampaign(id), opts);
  },

  postUpdate(campaignId, { title, body }) {
    return simulateRequest(async () => {
      const campaign = await ownCampaign(campaignId);
      if (title.trim().length < 3) throw new ServiceError('validation', 'Add a title', { title: 'Add a title' });
      if (body.trim().length < 10) throw new ServiceError('validation', 'Write a little more', { body: 'Write at least 10 characters' });
      const update = { id: randomId('u_'), title: title.trim(), body: body.trim(), at: new Date().toISOString() };
      const updates = [update, ...campaign.updates];
      db.patchCampaign(campaignId, { updates });
      notifyStakeholders(campaignId, (group) =>
        group === 'mine'
          ? null
          : {
              campaignId,
              link: { screen: 'campaign', id: campaignId },
              kind: 'update-posted',
              title: `Update from ${campaign.creator.name}`,
              body: `${update.title}: ${update.body.length > 90 ? `${update.body.slice(0, 89)}…` : update.body}`,
            },
      );
      return { ...campaign, updates };
    });
  },

  draftFor(campaignId, opts) {
    return simulateRequest(async () => {
      await ownCampaign(campaignId);
      return db.drafts().find((d) => d.campaignId === campaignId)?.id ?? null;
    }, opts);
  },
};
