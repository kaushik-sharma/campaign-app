import { activityGroupOf } from '@/domain/activity';
import { isPublic } from '@/domain/lifecycle';
import { computeReport } from '@/domain/report';
import type { ActivityEvent, ActivityKind, Campaign } from '@/domain/types';
import { formatMoney } from '@/lib/format';

import type { ReportService } from '../contracts';
import { ServiceError } from '../errors';
import { db } from './db';
import { addEvent, GUEST } from './events';
import { advanceDue } from './lifecycle';
import { simulateRequest } from './network';
import { currentUser } from './session';

export const mockReportService: ReportService = {
  get(campaignId, opts) {
    return simulateRequest(async () => {
      await db.ready();
      advanceDue();
      const user = await currentUser();
      const c = db.tables.campaigns.get(campaignId);
      const allowed = c && (isPublic(c.status) || c.status === 'refund-pending' || db.ownerOf(c.id) === user?.id);
      if (!c || !allowed) throw new ServiceError('not-found', 'Report not found');
      return computeReport(c);
    }, opts);
  },
};

type Draft = Omit<ActivityEvent, 'id' | 'at' | 'read' | 'campaignId'>;

/** Sample copy for every notification type, about a given campaign. */
function sample(kind: ActivityKind, c: Campaign | null): Draft {
  const title = c?.title ?? 'a campaign';
  const id = c?.id ?? '';
  const page = { screen: 'campaign' as const, id };
  const manage = { screen: 'manage' as const, id };
  const report = { screen: 'report' as const, id };
  const payments = { screen: 'payments' as const };
  const copy: Record<ActivityKind, Draft> = {
    'payment-succeeded': { kind, link: payments, title: `You backed ${title}`, body: '$25.00 contribution. Your receipt is in Payments.' },
    'payment-pending': { kind, link: payments, title: 'Payment processing', body: `Your bank is confirming your $25.00 contribution to ${title}.` },
    'payment-failed': { kind, link: payments, title: 'Payment declined', body: `Your $25.00 contribution to ${title} didn’t go through. You weren’t charged.` },
    'payment-cancelled': { kind, link: payments, title: 'Payment cancelled', body: `You cancelled a $25.00 contribution to ${title}. You weren’t charged.` },
    refund: { kind, link: payments, title: 'Refund on its way', body: `${title} didn’t raise enough to run ads, so your contribution is being refunded.` },
    milestone: { kind, link: page, title: `${title} is 75% funded`, body: c ? `${formatMoney(Math.round(c.goalCents * 0.75))} of ${formatMoney(c.goalCents)} raised so far.` : 'Three quarters of the way there.' },
    'goal-reached': { kind, link: page, title: `${title} reached its goal`, body: 'Ad setup with distribution partners begins next.' },
    'funding-ended': { kind, link: page, title: `Funding closed for ${title}`, body: 'What was raised still pays for a smaller ad run.' },
    'distribution-started': { kind, link: report, title: `Ads are live for ${title}`, body: 'Delivery appears in the report as it comes in.' },
    'report-ready': { kind, link: report, title: `Final report for ${title}`, body: 'See where the money went and how many people the ads reached.' },
    'update-posted': { kind, link: page, title: `Update from ${c?.creator.name ?? 'a creator'}`, body: 'Thank you for the support so far. Here’s what we’ve learned this week.' },
    submitted: { kind, link: manage, opensStatus: true, title: 'Campaign submitted for review', body: `“${title}” is with our review team.` },
    approved: { kind, link: manage, opensStatus: true, title: 'Your campaign was approved', body: `“${title}” passed review. It opens for backing shortly.` },
    'changes-requested': { kind, link: manage, opensStatus: true, title: 'Changes requested', body: `Review asked for changes to “${title}”.` },
    rejected: { kind, link: manage, opensStatus: true, title: 'Campaign not approved', body: `“${title}” didn’t meet the campaign rules.` },
    'funding-open': { kind, link: page, title: 'Your campaign is live', body: `“${title}” is open for backing and appears in Explore.` },
    welcome: { kind, link: { screen: 'profile' }, title: 'Welcome to Campaigns', body: 'Follow campaigns to get their milestones here, and create your own from the Create tab.' },
    'sign-in': { kind, link: { screen: 'profile' }, title: 'New sign-in', body: 'Your account was signed in on this device. If this wasn’t you, change your password.' },
  };
  return copy[kind];
}

/** Picks the most relevant campaign for a sample notification of this kind. */
function contextFor(kind: ActivityKind, userId: string | null): Campaign | null {
  const group = activityGroupOf({ kind } as ActivityEvent);
  if (group === 'account') return null;
  const byId = (ids: string[]) => ids.map((id) => db.tables.campaigns.get(id)).find((c): c is Campaign => !!c) ?? null;
  const owned = userId ? db.campaignsOwnedBy(userId)[0] ?? null : null;
  const backed = byId(db.backedBy(userId ?? GUEST));
  const followed = userId ? byId(db.engagedBy(userId, 'following')) : null;
  const anyPublic = [...db.tables.campaigns.values()].find((c) => isPublic(c.status)) ?? null;
  if (group === 'mine') return owned ?? anyPublic;
  if (group === 'backed') return backed ?? followed ?? anyPublic;
  return followed ?? backed ?? anyPublic;
}

export async function triggerNotification(kind: ActivityKind): Promise<void> {
  await db.ready();
  const userId = (await currentUser())?.id ?? null;
  const c = contextFor(kind, userId);
  const event = sample(kind, c);
  addEvent(userId ?? GUEST, { ...event, campaignId: c?.id ?? '', group: activityGroupOf({ ...event, campaignId: '' } as ActivityEvent) });
}
