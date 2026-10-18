import { z } from 'zod';

import { demo } from '@/config/demo';
import { acceptsContributions, isPublic } from '@/domain/lifecycle';
import { computeFees } from '@/domain/money';
import type { Campaign, Contribution, User } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';

import type { ActivityService, ContributionService } from '../contracts';
import { ServiceError } from '../errors';
import { db } from './db';
import { addEvent, GUEST, notifyStakeholders, randomId } from './events';
import { advanceDue } from './lifecycle';
import { simulateRequest } from './network';
import { currentUser } from './session';


const { minContributionCents: MIN, maxContributionCents: MAX } = demo.funding;
const amountMessage = `Enter an amount from ${formatMoney(MIN)} to ${formatMoney(MAX)}`;

const checkoutSchema = z.object({
  campaignId: z.string().min(1),
  amountCents: z.number().int(amountMessage).min(MIN, amountMessage).max(MAX, amountMessage),
  email: z.email('Enter a valid email address').optional(),
  showName: z.boolean(),
  idempotencyKey: z.string().min(8),
  simulate: z.enum(['approve', 'pending', 'decline', 'cancel']),
});


const ownerOf = (c: Contribution) => c.userId ?? GUEST;

/** Activity for one payment attempt, in the backer's own feed. */
function recordOutcome(c: Contribution, confirmedLater = false) {
  const amount = formatMoney(c.amountCents, { showCents: true });
  const base = {
    campaignId: c.campaignId,
    contributionId: c.id,
    group: 'backed' as const,
    link: { screen: 'receipt' as const, id: c.id },
  };
  switch (c.status) {
    case 'succeeded':
      addEvent(ownerOf(c), {
        ...base,
        kind: 'payment-succeeded',
        title: confirmedLater ? 'Payment confirmed' : `You backed ${c.campaignTitle}`,
        body: confirmedLater
          ? `Your ${amount} contribution to ${c.campaignTitle} went through and now counts toward its goal.`
          : `${amount} contribution. Receipt ${c.receiptNumber}.`,
      });
      break;
    case 'pending':
      addEvent(ownerOf(c), {
        ...base,
        kind: 'payment-pending',
        title: 'Payment processing',
        body: `Your bank is confirming your ${amount} contribution to ${c.campaignTitle}. Totals update once it’s confirmed.`,
      });
      break;
    case 'failed':
      addEvent(ownerOf(c), {
        ...base,
        kind: 'payment-failed',
        title: 'Payment declined',
        body: `Your ${amount} contribution to ${c.campaignTitle} didn’t go through. You weren’t charged.`,
      });
      break;
    case 'cancelled':
      addEvent(ownerOf(c), {
        ...base,
        kind: 'payment-cancelled',
        title: 'Payment cancelled',
        body: `You cancelled a ${amount} contribution to ${c.campaignTitle}. You weren’t charged.`,
      });
      break;
  }
}

/** Funding milestones crossed by this contribution go to the backer and every follower. */
function recordMilestones(campaign: Campaign, beforeCents: number, afterCents: number, backer: string) {
  const before = beforeCents / campaign.goalCents;
  const after = afterCents / campaign.goalCents;
  const crossed = demo.funding.milestones.filter((m) => before < m && after >= m);
  const top = crossed.at(-1);
  if (top === undefined) return;

  // Only the highest milestone crossed, so one large contribution doesn't produce a burst of events.
  notifyStakeholders(
    campaign.id,
    (group) => ({
      campaignId: campaign.id,
      link: group === 'mine' ? { screen: 'manage', id: campaign.id } : { screen: 'campaign', id: campaign.id },
      kind: top >= 1 ? 'goal-reached' : 'milestone',
      title:
        group === 'mine'
          ? top >= 1
            ? `Your campaign reached its goal`
            : `Your campaign is ${formatPercent(top)} funded`
          : top >= 1
            ? `${campaign.title} reached its goal`
            : `${campaign.title} is ${formatPercent(top)} funded`,
      body:
        top >= 1
          ? `“${campaign.title}” is fully funded. Ad setup with distribution partners begins next.`
          : `${formatMoney(afterCents)} of ${formatMoney(campaign.goalCents)} raised so far.`,
    }),
    [backer],
  );
}

/** Counts a successful payment toward the campaign: raised, backers and, at 100%, its status. */
function applyFunding(c: Contribution): Contribution {
  const campaign = db.tables.campaigns.get(c.campaignId);
  if (!campaign) return c;
  const beforeCents = campaign.raisedCents;
  const afterCents = beforeCents + c.amountCents;
  const reachedGoal = campaign.status === 'funding' && afterCents >= campaign.goalCents;

  db.patchCampaign(campaign.id, {
    raisedCents: afterCents,
    backerCount: campaign.backerCount + 1,
    ...(reachedGoal
      ? {
          status: 'goal-reached' as const,
          history: [...campaign.history, { status: 'goal-reached' as const, at: new Date().toISOString() }],
        }
      : {}),
  });
  recordMilestones(campaign, beforeCents, afterCents, ownerOf(c));
  return { ...c, funding: { beforeCents, afterCents, goalCents: campaign.goalCents } };
}

/** Confirms a pending payment once its demo delay has passed. Safe to call repeatedly. */
function settle(c: Contribution): Contribution {
  if (c.status !== 'pending') return c;
  const due = new Date(c.createdAt).getTime() + demo.payments.pendingResolveSec * 1000;
  if (Date.now() < due) return c;
  const confirmed = applyFunding({ ...c, status: 'succeeded', settledAt: new Date().toISOString() });
  db.saveContribution(confirmed);
  recordOutcome(confirmed, true);
  return confirmed;
}

function settleAll() {
  db.contributions().forEach(settle);
}

/** Guest payments on this device are readable by whoever uses the device; account payments only by their owner. */
function canRead(c: Contribution, user: User | null) {
  return c.userId === null || c.userId === user?.id;
}

export const mockContributionService: ContributionService = {
  checkout(input) {
    return simulateRequest(async () => {
      await db.ready();
      const parsed = checkoutSchema.safeParse(input);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
        throw new ServiceError('validation', Object.values(fieldErrors)[0] ?? 'Check your details', fieldErrors);
      }
      const data = parsed.data;

      // A retry of a request that already went through returns the original result.
      const existing = db.contributionForKey(data.idempotencyKey);
      if (existing) return settle(existing);

      const user = await currentUser();
      // Cancelling needs no receipt address; every charge attempt does.
      const email = user?.email ?? data.email ?? '';
      if (!email && data.simulate !== 'cancel') {
        throw new ServiceError('validation', 'Enter your email for the receipt', {
          email: 'Enter your email for the receipt',
        });
      }

      const campaign = db.tables.campaigns.get(data.campaignId);
      if (!campaign || !isPublic(campaign.status)) throw new ServiceError('not-found', 'Campaign not found');
      if (!acceptsContributions(campaign.status)) {
        throw new ServiceError('conflict', 'This campaign is no longer accepting contributions.');
      }

      const fees = computeFees(data.amountCents);
      const now = new Date().toISOString();
      const status = (
        { approve: 'succeeded', pending: 'pending', decline: 'failed', cancel: 'cancelled' } as const
      )[data.simulate];

      let contribution: Contribution = {
        id: randomId('ct_'),
        receiptNumber: `CMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        status,
        amountCents: fees.contributionCents,
        processingFeeCents: fees.processingFeeCents,
        totalChargeCents: fees.totalChargeCents,
        platformFeeCents: fees.platformFeeCents,
        adBudgetCents: fees.adBudgetCents,
        userId: user?.id ?? null,
        email,
        publicName: data.showName && user ? user.name : null,
        cardLast4: demo.payments.demoCardLast4,
        createdAt: now,
        settledAt: status === 'pending' ? null : now,
        failureReason: status === 'failed' ? 'Your card was declined by the issuer.' : null,
        funding: null,
      };

      if (status === 'succeeded') contribution = applyFunding(contribution);
      db.saveContribution(contribution, data.idempotencyKey);
      recordOutcome(contribution);

      if (status === 'pending') {
        // Confirm in the background too, so Activity updates even if nobody is polling.
        const id = contribution.id;
        setTimeout(() => {
          const current = db.findContribution(id);
          if (current) settle(current);
        }, demo.payments.pendingResolveSec * 1000 + 50);
      }
      return contribution;
    });
  },

  get(id, opts) {
    return simulateRequest(async () => {
      await db.ready();
      const user = await currentUser();
      const found = db.findContribution(id);
      if (!found || !canRead(found, user)) throw new ServiceError('not-found', 'Receipt not found');
      return settle(found);
    }, opts);
  },

  listMine(opts) {
    return simulateRequest(async () => {
      await db.ready();
      settleAll();
      const user = await currentUser();
      return db
        .contributions()
        .filter((c) => c.userId === (user?.id ?? null))
        .reverse();
    }, opts);
  },
};

export const mockActivityService: ActivityService = {
  list(opts) {
    return simulateRequest(async () => {
      await db.ready();
      settleAll();
      advanceDue();
      const user = await currentUser();
      return [...db.activity(user?.id ?? GUEST)].reverse();
    }, opts);
  },

  markAllRead() {
    return simulateRequest(
      async () => {
        await db.ready();
        const user = await currentUser();
        db.markActivityRead(user?.id ?? GUEST);
      },
      { canFail: false },
    );
  },
};
