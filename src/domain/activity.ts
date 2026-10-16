import type { ActivityEvent, ActivityGroup, ActivityKind, ActivityLink } from './types';

export const ACTIVITY_GROUPS: ActivityGroup[] = ['mine', 'backed', 'following', 'account'];

export const activityGroupLabels: Record<ActivityGroup, string> = {
  mine: 'My campaigns',
  backed: 'Backed',
  following: 'Following',
  account: 'Account',
};

export const activityGroupHints: Record<ActivityGroup, string> = {
  mine: 'Review decisions, funding and delivery for campaigns you created',
  backed: 'Payments, refunds and progress of campaigns you backed',
  following: 'Milestones and updates from campaigns you follow',
  account: 'Sign-ins and account changes',
};

const DEFAULT_GROUP: Record<ActivityKind, ActivityGroup> = {
  'payment-succeeded': 'backed',
  'payment-pending': 'backed',
  'payment-failed': 'backed',
  'payment-cancelled': 'backed',
  refund: 'backed',
  milestone: 'backed',
  'goal-reached': 'backed',
  'funding-ended': 'backed',
  'distribution-started': 'backed',
  'report-ready': 'backed',
  'update-posted': 'following',
  submitted: 'mine',
  approved: 'mine',
  'changes-requested': 'mine',
  rejected: 'mine',
  'funding-open': 'mine',
  welcome: 'account',
  'sign-in': 'account',
};

/** Older events (saved before groups existed) fall back to their kind's usual group. */
export function activityGroupOf(e: ActivityEvent): ActivityGroup {
  return e.group ?? DEFAULT_GROUP[e.kind];
}

export function activityLinkOf(e: ActivityEvent): ActivityLink | null {
  if (e.link) return e.link;
  if (e.contributionId) return { screen: 'receipt', id: e.contributionId };
  if (e.opensStatus) return { screen: 'manage', id: e.campaignId };
  if (e.campaignId) return { screen: 'campaign', id: e.campaignId };
  return null;
}

/** Events of the same kind about the same campaign on the same day collapse into one row. */
export type ActivityItem = { key: string; event: ActivityEvent; more: ActivityEvent[] };

export function groupDuplicates(events: ActivityEvent[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  const index = new Map<string, ActivityItem>();
  for (const e of events) {
    const day = e.at.slice(0, 10);
    const key = `${e.kind}|${e.campaignId}|${day}`;
    const existing = e.contributionId ? undefined : index.get(key);
    if (existing) existing.more.push(e);
    else {
      const item = { key: e.id, event: e, more: [] };
      items.push(item);
      if (!e.contributionId) index.set(key, item);
    }
  }
  return items;
}
