import { demo } from '@/config/demo';
import { canTransition, type CampaignStatus } from '@/domain/lifecycle';
import type { Campaign } from '@/domain/types';
import { readJSON, writeJSON } from '@/lib/storage';

import type { LifecycleSettings } from '../contracts';
import { db } from './db';
import { addEvent } from './events';

/**
 * The review / launch simulator for campaigns created in the app. Status moves forward on timers
 * (or on demand from the dev panel) and every move notifies the creator in Activity:
 *
 *   submitted ─(decision)→ approved | changes-requested | rejected
 *   approved ─(open)→ funding (public, accepts contributions)
 *
 * Evaluated lazily whenever campaign data is read, so it catches up after the app was closed.
 */
const STORAGE_KEY = 'mock:lifecycle:v1';

let settings: LifecycleSettings = { autoAdvance: demo.lifecycle.autoAdvance, decision: 'approve' };

void readJSON<LifecycleSettings>(STORAGE_KEY).then((saved) => {
  if (saved) settings = { ...settings, ...saved };
});

export const lifecycleControls = {
  get: () => settings,
  set(patch: Partial<LifecycleSettings>) {
    settings = { ...settings, ...patch };
    void writeJSON(STORAGE_KEY, settings);
  },
};

const CHANGES_NOTE =
  'Add a source for the statistic in your story, and make sure the ad headline matches the story’s main claim.';

const lastEventAt = (c: Campaign) => new Date(c.history.at(-1)?.at ?? c.submittedAt ?? Date.now()).getTime();

function nextStatus(status: CampaignStatus): CampaignStatus | null {
  if (status === 'submitted') {
    return settings.decision === 'approve' ? 'approved' : settings.decision === 'changes' ? 'changes-requested' : 'rejected';
  }
  if (status === 'approved') return 'funding';
  return null;
}

/** Seconds a campaign waits in `status` before moving on. */
function delayFor(status: CampaignStatus): number | null {
  if (status === 'submitted') return demo.lifecycle.reviewDecisionSec;
  if (status === 'approved') return demo.lifecycle.openForFundingSec - demo.lifecycle.reviewDecisionSec;
  return null;
}

function move(c: Campaign, to: CampaignStatus, atMs: number): Campaign {
  if (!canTransition(c.status, to)) return c;
  const at = new Date(atMs).toISOString();
  const opening = to === 'funding';
  const next: Campaign = {
    ...c,
    status: to,
    history: [...c.history, { status: to, at, ...(to === 'changes-requested' ? { note: CHANGES_NOTE } : {}) }],
    ...(opening
      ? {
          publishedAt: at,
          fundingEndsAt: new Date(atMs + demo.lifecycle.fundingWindowDays * 86_400_000).toISOString(),
        }
      : {}),
  };
  db.patchCampaign(c.id, { status: next.status, history: next.history, publishedAt: next.publishedAt, fundingEndsAt: next.fundingEndsAt });
  notify(next, to);
  return next;
}

function notify(c: Campaign, to: CampaignStatus) {
  const base = { campaignId: c.id, opensStatus: true };
  const owner = c.creator.id;
  switch (to) {
    case 'approved':
      addEvent(owner, { ...base, kind: 'approved', title: 'Your campaign was approved', body: `“${c.title}” passed review. It opens for backing shortly.` });
      break;
    case 'changes-requested':
      addEvent(owner, { ...base, kind: 'changes-requested', title: 'Changes requested', body: `Review asked for changes to “${c.title}”. ${CHANGES_NOTE}` });
      break;
    case 'rejected':
      addEvent(owner, { ...base, kind: 'rejected', title: 'Campaign not approved', body: `“${c.title}” didn’t meet the campaign rules. See the review note for details.` });
      break;
    case 'funding':
      addEvent(owner, { ...base, opensStatus: false, kind: 'funding-open', title: 'Your campaign is live', body: `“${c.title}” is now open for backing and appears in Explore.` });
      break;
  }
}

/** Applies every timer-based move that is due. Cheap; call before reading campaign data. */
export function advanceDue(now = Date.now()) {
  if (!settings.autoAdvance) return;
  for (const campaign of db.createdCampaigns()) {
    let c = campaign;
    // Catch up through several steps if the app was closed for a while.
    for (let guard = 0; guard < 3; guard++) {
      const delay = delayFor(c.status);
      const to = nextStatus(c.status);
      if (delay === null || !to) break;
      const due = lastEventAt(c) + delay * 1000;
      if (now < due) break;
      c = move(c, to, due);
    }
  }
}

/** Dev panel: move one campaign (default: the most recent one still moving) forward now. */
export function advanceNow(id?: string): { id: string; status: CampaignStatus } | null {
  const candidates = db
    .createdCampaigns()
    .filter((c) => (id ? c.id === id : nextStatus(c.status) !== null))
    .sort((a, b) => lastEventAt(b) - lastEventAt(a));
  const c = candidates[0];
  const to = c && nextStatus(c.status);
  if (!c || !to) return null;
  const moved = move(c, to, Date.now());
  return { id: moved.id, status: moved.status };
}
