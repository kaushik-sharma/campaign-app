import { demo } from '@/config/demo';
import { canTransition, type CampaignStatus } from '@/domain/lifecycle';
import type { Campaign } from '@/domain/types';
import { formatMoney } from '@/lib/format';
import { readJSON, writeJSON } from '@/lib/storage';

import type { LifecycleSettings } from '../contracts';
import { db } from './db';
import { addEvent, notifyStakeholders } from './events';

/**
 * The lifecycle simulator. Review and launch of app-created campaigns run on timers; every later
 * stage (funding closes, ads set up, ads live, completed, refunds) can be stepped from the
 * creator's manage screen or the developer controls. Every move notifies the people involved:
 *
 *   submitted ─→ approved | changes-requested | rejected      (timer)
 *   approved ─→ funding                                       (timer)
 *   funding ─→ goal-reached | funding-ended                   (on demand)
 *   goal-reached ─→ distribution-prep ─→ promoting ─→ completed
 *   funding-ended ─→ distribution-prep, or refund-pending under the minimum
 *
 * Timers are evaluated lazily whenever data is read, so they catch up after the app was closed.
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

/** The status a campaign moves to next, or null at the end of the line. */
export function nextStatus(c: Campaign): CampaignStatus | null {
  switch (c.status) {
    case 'submitted':
      return settings.decision === 'approve' ? 'approved' : settings.decision === 'changes' ? 'changes-requested' : 'rejected';
    case 'approved':
      return 'funding';
    case 'funding':
      return c.raisedCents >= c.goalCents ? 'goal-reached' : 'funding-ended';
    case 'goal-reached':
      return 'distribution-prep';
    case 'funding-ended':
      return c.raisedCents >= demo.funding.minimumToDistributeCents ? 'distribution-prep' : 'refund-pending';
    case 'distribution-prep':
      return 'promoting';
    case 'promoting':
      return 'completed';
    default:
      return null;
  }
}

/** Seconds a campaign waits before moving on by itself (only review and launch are timed). */
function delayFor(status: CampaignStatus): number | null {
  if (status === 'submitted') return demo.lifecycle.reviewDecisionSec;
  if (status === 'approved') return demo.lifecycle.openForFundingSec - demo.lifecycle.reviewDecisionSec;
  return null;
}

function move(c: Campaign, to: CampaignStatus, atMs: number): Campaign {
  if (!canTransition(c.status, to)) return c;
  const at = new Date(atMs).toISOString();
  const event = { status: to, at, ...(to === 'changes-requested' ? { note: CHANGES_NOTE, editStep: 'story' as const } : {}) };
  const opening = to === 'funding';
  const closing = to === 'goal-reached' || to === 'funding-ended';
  const patch: Partial<Campaign> = {
    status: to,
    history: [...c.history, event],
    ...(opening
      ? { publishedAt: at, fundingEndsAt: new Date(atMs + demo.lifecycle.fundingWindowDays * 86_400_000).toISOString() }
      : {}),
    // Closing funding early (on demand) ends the window now so "time left" agrees everywhere.
    ...(closing && c.fundingEndsAt && new Date(c.fundingEndsAt).getTime() > atMs ? { fundingEndsAt: at } : {}),
  };
  db.patchCampaign(c.id, patch);
  const next = { ...c, ...patch };
  notify(next, to);
  return next;
}

function notify(c: Campaign, to: CampaignStatus) {
  const owner = db.ownerOf(c.id);
  const manage = { screen: 'manage' as const, id: c.id };
  const page = { screen: 'campaign' as const, id: c.id };
  const report = { screen: 'report' as const, id: c.id };
  const raised = formatMoney(c.raisedCents);
  const mine = (event: Parameters<typeof addEvent>[1]) => owner && addEvent(owner, { ...event, group: 'mine', opensStatus: true });

  switch (to) {
    case 'approved':
      mine({ campaignId: c.id, link: manage, kind: 'approved', title: 'Your campaign was approved', body: `“${c.title}” passed review. It opens for backing shortly.` });
      break;
    case 'changes-requested':
      mine({ campaignId: c.id, link: manage, kind: 'changes-requested', title: 'Changes requested', body: `Review asked for changes to “${c.title}”. ${CHANGES_NOTE}` });
      break;
    case 'rejected':
      mine({ campaignId: c.id, link: manage, kind: 'rejected', title: 'Campaign not approved', body: `“${c.title}” didn’t meet the campaign rules. See the review note for details.` });
      break;
    case 'funding':
      mine({ campaignId: c.id, link: page, kind: 'funding-open', title: 'Your campaign is live', body: `“${c.title}” is now open for backing and appears in Explore.` });
      break;
    case 'goal-reached':
      notifyStakeholders(c.id, (group) => ({
        campaignId: c.id,
        link: group === 'mine' ? manage : page,
        kind: 'goal-reached',
        title: group === 'mine' ? 'Your campaign reached its goal' : `${c.title} reached its goal`,
        body: `${raised} raised. Ad setup with distribution partners begins next.`,
      }));
      break;
    case 'funding-ended': {
      const enough = c.raisedCents >= demo.funding.minimumToDistributeCents;
      notifyStakeholders(c.id, (group) => ({
        campaignId: c.id,
        link: group === 'mine' ? manage : page,
        kind: 'funding-ended',
        title: group === 'mine' ? 'Funding has closed' : `Funding closed for ${c.title}`,
        body: enough
          ? `${raised} of ${formatMoney(c.goalCents)} was raised. It still pays for a smaller ad run.`
          : `${raised} was raised, under the ${formatMoney(demo.funding.minimumToDistributeCents)} minimum, so backers will be refunded.`,
      }));
      break;
    }
    case 'refund-pending':
      notifyStakeholders(c.id, (group) =>
        group === 'backed'
          ? { campaignId: c.id, link: { screen: 'payments' }, kind: 'refund', title: 'Refund on its way', body: `“${c.title}” didn’t raise enough to run ads, so your contribution is being refunded in full.` }
          : group === 'mine'
            ? { campaignId: c.id, link: manage, kind: 'refund', title: 'Backers are being refunded', body: `“${c.title}” closed under the minimum, so every backer gets a full refund.` }
            : null,
      );
      break;
    case 'distribution-prep':
      mine({ campaignId: c.id, link: manage, kind: 'distribution-started', title: 'Ads are being set up', body: `Our team is preparing ads for “${c.title}” with distribution partners.` });
      break;
    case 'promoting':
      notifyStakeholders(c.id, (group) => ({
        campaignId: c.id,
        link: group === 'mine' ? manage : report,
        kind: 'distribution-started',
        title: group === 'mine' ? 'Your ads are live' : `Ads are live for ${c.title}`,
        body: `The ${c.durationDays}-day ad run has started. Delivery appears in the report as it comes in.`,
      }));
      break;
    case 'completed':
      notifyStakeholders(c.id, (group) => ({
        campaignId: c.id,
        link: report,
        kind: 'report-ready',
        title: group === 'mine' ? 'Your final report is ready' : `Final report for ${c.title}`,
        body: 'The ad run has finished. See where the money went and how many people the ads reached.',
      }));
      db.backersOf(c.id).forEach((who) =>
        addEvent(who, {
          campaignId: c.id,
          group: 'backed',
          link: report,
          kind: 'refund',
          title: 'Unspent budget refunded',
          body: `A small part of the ad budget for “${c.title}” wasn’t spent. Your share is refunded in proportion to what you gave.`,
        }),
      );
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
      const to = nextStatus(c);
      if (delay === null || !to) break;
      const due = lastEventAt(c) + delay * 1000;
      if (now < due) break;
      c = move(c, to, due);
    }
  }
}

/**
 * Moves one campaign to its next status now. With no id: the most recent app-created campaign
 * still in review or waiting to open.
 */
export function advanceNow(id?: string): { id: string; status: CampaignStatus } | null {
  const target = id
    ? db.tables.campaigns.get(id)
    : db
        .createdCampaigns()
        .filter((c) => c.status === 'submitted' || c.status === 'approved')
        .sort((a, b) => lastEventAt(b) - lastEventAt(a))[0];
  const to = target && nextStatus(target);
  if (!target || !to) return null;
  const moved = move(target, to, Date.now());
  return { id: moved.id, status: moved.status };
}
