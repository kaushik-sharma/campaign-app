import { demo } from '@/config/demo';

import type { CampaignStatus } from './lifecycle';
import type { CampaignSummary } from './types';

export type DashboardTab = 'drafts' | 'review' | 'funding' | 'promoting' | 'completed' | 'action';

export const dashboardTabLabels: Record<DashboardTab, string> = {
  drafts: 'Drafts',
  review: 'Under review',
  funding: 'Funding',
  promoting: 'Promoting',
  completed: 'Completed',
  action: 'Requires action',
};

const BUCKET: Record<CampaignStatus, Exclude<DashboardTab, 'drafts'>> = {
  draft: 'review',
  submitted: 'review',
  approved: 'review',
  'changes-requested': 'action',
  rejected: 'completed',
  funding: 'funding',
  'goal-reached': 'funding',
  'funding-ended': 'funding',
  'distribution-prep': 'promoting',
  promoting: 'promoting',
  completed: 'completed',
  cancelled: 'completed',
  'refund-pending': 'completed',
  failed: 'completed',
};

export function dashboardTabOf(status: CampaignStatus) {
  return BUCKET[status];
}

/** The one thing the creator should do (or expect) next. */
export function nextAction(c: CampaignSummary): string {
  switch (c.status) {
    case 'submitted':
      return 'In review. You’ll hear back in Activity.';
    case 'approved':
      return 'Approved. Opens for backing shortly.';
    case 'changes-requested':
      return 'Edit and resubmit';
    case 'rejected':
      return 'Read the review note';
    case 'funding':
      return 'Share it to reach the goal';
    case 'goal-reached':
      return 'Fully funded. Ad setup comes next.';
    case 'funding-ended':
      return c.raisedCents >= demo.funding.minimumToDistributeCents ? 'A smaller ad run goes ahead' : 'Backers will be refunded';
    case 'distribution-prep':
      return 'Ads are being set up';
    case 'promoting':
      return 'Track delivery';
    case 'completed':
      return 'View the final report';
    case 'refund-pending':
      return 'Refunds in progress';
    default:
      return 'View details';
  }
}

/** Statuses with a delivery report worth opening. */
export function hasReport(status: CampaignStatus) {
  return ['promoting', 'completed', 'refund-pending', 'distribution-prep', 'funding-ended', 'goal-reached'].includes(status);
}
